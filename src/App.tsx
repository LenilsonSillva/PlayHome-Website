import { PlayerContextProvider } from "./contexts/playersProvider";
import { AppRoutes } from "./routes";
import "./styles/theme.css";
import "./styles/global.css";
import { SocketProvider } from "./contexts/socketContext";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./contexts/themeContext";
import { SiteControls } from "./components/SiteControls/SiteControls";
import { SpeedInsights } from "@vercel/speed-insights/next"

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <SocketProvider>
          <PlayerContextProvider>
            <SpeedInsights />
            <SiteControls />
            <AppRoutes />
          </PlayerContextProvider>
        </SocketProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
