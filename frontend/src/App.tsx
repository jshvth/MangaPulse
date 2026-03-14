import { Routes, Route } from "react-router-dom";
import { BackgroundDecor } from "./components/BackgroundDecor";
import { TopNav } from "./components/TopNav";
import { AuthPage } from "./pages/AuthPage";
import { CollectionPage } from "./pages/CollectionPage";
import { MangaDetailPage } from "./pages/MangaDetailPage";
import { AuthGate } from "./components/AuthGate";

function App() {
  return (
    <div className="min-h-screen px-4 py-6 text-ink md:px-10">
      <BackgroundDecor />
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <TopNav />
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route
            path="/collection"
            element={
              <AuthGate>
                <CollectionPage />
              </AuthGate>
            }
          />
          <Route
            path="/manga/:id"
            element={
              <AuthGate>
                <MangaDetailPage />
              </AuthGate>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
