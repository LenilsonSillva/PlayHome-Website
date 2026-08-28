import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/home";
import { Impostor } from "../pages/games/impostor";
import { OfflineImpostorGame } from "../pages/games/impostor/OffLineImpostor";
import { OnlineImpostorGame } from "../pages/games/impostor/OnlineImpostor";
import { SecretWordGame } from "../pages/games/secretWord/secretWordGame";
import CriptographyLobby from "../pages/games/secretWord/Lobby";
import { OnlineCryptoGame } from "../pages/games/secretWord/OnlineCryptoGame";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<h1>404 - Not Found</h1>} />
        <Route path="/games/impostor/lobby" element={<Impostor />} />
        <Route
          path="/games/impostor/offline"
          element={<OfflineImpostorGame />}
        />
        <Route path="/games/impostor/online" element={<OnlineImpostorGame />} />
        <Route path="/games/secretWord/game" element={<SecretWordGame />} />
        <Route path="/games/secretWord/lobby" element={<CriptographyLobby />} />
        <Route path="/games/secretWord/online" element={<OnlineCryptoGame />} />
      </Routes>
    </BrowserRouter>
  );
}
