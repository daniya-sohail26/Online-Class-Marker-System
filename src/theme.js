import { createTheme } from "@mui/material/styles";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { 
      main: "#00DDB3", // Vibrant Aquamarine
      contrastText: "#000000" 
    }, 
    secondary: { 
      main: "#06B6D4", // Rich Teal
      contrastText: "#ffffff" 
    },
    success: { main: "#10B981" },
    warning: { main: "#F59E0B" },
    background: {
      default: "#10162A", // Deepest Midnight Indigo
      paper: "#161F3D", // Slightly elevated, rich Teal-Indigo for cards
    },
    text: { 
      primary: "#E0F2F1", // Crisp white/light cyan for primary text
      secondary: "#B0BEC5" // Soft blue-grey for secondary text
    },
    divider: "rgba(255, 255, 255, 0.06)",
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: "-0.04em" },
    h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: "-0.03em" },
    h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.5px" },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#10162A",
          // Complex layered procedural gradients (Aurora effects)
          backgroundImage: `
            radial-gradient(circle at 15% 50%, rgba(0, 221, 179, 0.05), transparent 25%), 
            radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.04), transparent 25%)
          `,
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(22, 31, 61, 0.6)",
          backdropFilter: "blur(20px) saturate(160%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          // Layered shadows with custom glows for depth
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 221, 179, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: "linear-gradient(135deg, #00DDB3 0%, #06B6D4 100%)",
          boxShadow: "0 0 15px rgba(0, 221, 179, 0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #06B6D4 0%, #00DDB3 100%)",
            boxShadow: "0 0 25px rgba(0, 221, 179, 0.5)",
            transform: "translateY(-1px)",
          },
          transition: "all 0.2s ease-in-out",
        },
      },
    },
  },
});

export default theme;