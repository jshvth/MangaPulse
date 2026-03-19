import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const ensureTransporter = async () => {
  const user = process.env.ETHEREAL_USER;
  const pass = process.env.ETHEREAL_PASS;

  if (user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user, pass },
      }),
      account: { user, pass },
    };
  }

  const account = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
  return { transporter, account };
};

const run = async () => {
  const { transporter, account } = await ensureTransporter();
  console.log("Ethereal account:", account.user);

  const { data: pending, error } = await supabase
    .from("notification_queue")
    .select(
      "id, user_manga_id, release_id, manga_releases(volume), user_mangas(user_id, title)"
    )
    .eq("status", "pending")
    .limit(20);

  if (error) {
    console.error("Failed to load pending notifications:", error.message);
    process.exit(1);
  }

  if (!pending?.length) {
    console.log("No pending notifications.");
    return;
  }

  const successfulUserMangaIds = new Set<string>();

  for (const item of pending) {
    const userId = item.user_mangas?.user_id as string | undefined;
    const title = item.user_mangas?.title as string | undefined;
    const volume = item.manga_releases?.volume as number | undefined;

    if (!userId || !title) {
      await supabase
        .from("notification_queue")
        .update({ status: "failed", error: "Missing user or title" })
        .eq("id", item.id);
      continue;
    }

    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);
    const email = userData?.user?.email ?? null;

    if (userError || !email) {
      await supabase
        .from("notification_queue")
        .update({ status: "failed", error: "Missing user email" })
        .eq("id", item.id);
      continue;
    }

    const subject = volume
      ? `Neue Manga-Veroeffentlichung: ${title} Band ${volume}`
      : `Neue Manga-Veroeffentlichung: ${title}`;
    const bodyText = volume
      ? `Gute Nachrichten! Ein neuer Band von ${title} ist verfuegbar: Band ${volume}.`
      : `Gute Nachrichten! Es gibt ein neues Update zu ${title}.`;

    const info = await transporter.sendMail({
      from: "MangaPulse <no-reply@mangapulse.dev>",
      to: email,
      subject,
      text: bodyText,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Sent to ${email}`, previewUrl ?? "");

    await supabase
      .from("notification_queue")
      .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
      .eq("id", item.id);

    successfulUserMangaIds.add(item.user_manga_id as string);
  }

  for (const userMangaId of successfulUserMangaIds) {
    await supabase
      .from("user_mangas")
      .update({ needs_notification: false, last_notified_at: new Date().toISOString() })
      .eq("id", userMangaId);
  }
};

run().catch((error) => {
  console.error("Ethereal sender failed:", error);
  process.exit(1);
});
