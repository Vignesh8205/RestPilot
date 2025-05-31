// App.js
import React, { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Home from "./components/Api";
import { IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

export default function App() {
  const [mode, setMode] = useState("light");

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1976d2" },
          secondary: { main: "#9c27b0" },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Router>
      <div style={{ position: "absolute", top: 50, right: 100 }}>
        <IconButton onClick={toggleColorMode} color="inherit" >
          {mode === "light" ? <Brightness4Icon  />  : <Brightness7Icon />}
        </IconButton>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  </ThemeProvider>
);

}