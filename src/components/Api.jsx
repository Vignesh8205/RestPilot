// components/Home.js
import React, { useRef, useState } from "react";
import {
  Container,
  Typography,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Paper,
  Tabs,
  Tab,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import Editor from "@monaco-editor/react";

import { json2xml, xml2json } from "xml-js";
import { Buffer } from 'buffer';

window.Buffer = Buffer;

import axios from "axios";
import { Download } from "@mui/icons-material";

const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const authTypes = ["None", "Bearer Token", "Basic Auth", "API Key"];

export default function Home() {

  // State variables
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
// Authentication
  const [authType, setAuthType] = useState("None");
  const [authValue, setAuthValue] = useState("");
  const [response, setResponse] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  const [convertedOutput, setConvertedOutput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const targetRef = useRef(null);



// State for height and width of the editor
  const [height, setHeight] = useState(500); // default height in px
  const [width, setWidth] = useState(900);

// Function to handle header input changes
  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  // Function to add a new header input

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };
// Function to remove a header input by index
  const removeHeader = (index) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders.length ? newHeaders : [{ key: "", value: "" }]);
  };



// Function to handle sending the request

  const handleSend = async () => {
    try {
      const finalHeaders = {};

      headers.forEach(({ key, value }) => {
        if (key.trim()) finalHeaders[key.trim()] = value.trim();
      });
      if (authType === "Bearer Token") {
        finalHeaders["Authorization"] = `Bearer ${authValue}`;
      } else if (authType === "Basic Auth") {
        finalHeaders["Authorization"] = `Basic ${btoa(authValue)}`;
      } else if (authType === "API Key") {
        finalHeaders["x-api-key"] = authValue;
      }
      const res = await axios({
        method,
        url,
        headers: finalHeaders,
        data: body ? JSON.parse(body) : undefined,
        responseType: "arraybuffer", // important for binary data like images
      });



      const contentType = res.headers["content-type"];
      let finalData = res.data;

      if (contentType && contentType.startsWith("image/")) {
        const base64 = Buffer.from(res.data, "binary").toString("base64");
        finalData = `data:${contentType};base64,${base64}`;
      }
      else if (contentType && contentType.includes("application/json")) {
        finalData = JSON.parse(Buffer.from(res.data, "binary").toString("utf-8"));
      } else if (contentType && contentType.includes("application/xml")) {
        finalData = Buffer.from(res.data, "binary").toString("utf-8");
      } else {
        finalData = Buffer.from(res.data, "binary").toString("utf-8");
      }

      setResponse({ ...res, data: finalData, contentType });


    } catch (error) {
      setResponse(error.response || { status: "Error", data: error.message });
    }
  };
// Function to download the response data as JSON or XML
  const download = (type) => {
    const blob = new Blob([
      type === "json" ? JSON.stringify(response.data, null, 2) : response.data,
    ], {
      type: type === "json" ? "application/json" : "application/xml",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `response.${type}`;
    link.click();
  };
// Function to convert XML to JSON and download it
  const handleXmlToJson = () => {
    try {
      if (!response || !response.data) {
        setConvertedOutput("No response to convert.");
        return;
      }

      let rawData = response.data;

      // If response.data is an object, try to convert it to string (unlikely for XML, but safe)
      if (typeof rawData !== "string") {
        rawData = JSON.stringify(rawData);
      }

      // Try to convert XML to JSON string
      const jsonString = xml2json(rawData, { compact: true, spaces: 2 });

      // Parse JSON string to object (to validate JSON correctness)
      const jsonObj = JSON.parse(jsonString);

      // Pretty print JSON
      const prettyJson = JSON.stringify(jsonObj, null, 2);
      setConvertedOutput(prettyJson);

      // Trigger download of converted JSON file
      const blob = new Blob([prettyJson], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "converted.json";
      link.click();
    } catch (err) {
      console.error("XML to JSON conversion failed", err);
      setConvertedOutput("Invalid XML input or parse error.");
    }
  };
// Function to convert JSON to XML and download it
  const handleJsonToXml = () => {
    console.log(response.data);

    try {
      if (!response || !response.data) {
        setConvertedOutput("No response to convert.");
        return;
      }

      let jsonData;

      // Case 1: If response.data is already an object (Axios usually returns this)
      if (typeof response.data === "object") {
        jsonData = response.data;
      }
      // Case 2: If response.data is a string, try parsing it
      else if (typeof response.data === "string") {
        try {
          jsonData = JSON.parse(response.data);
        } catch (innerErr) {
          console.error("JSON parse failed: ", innerErr);
          setConvertedOutput("Response is not valid JSON string.");
          return;
        }
      } else {
        setConvertedOutput("Unsupported data format.");
        return;
      }

      const xml = json2xml(jsonData, { compact: true, spaces: 2 });
      setConvertedOutput(xml);

      const blob = new Blob([xml], { type: "application/xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "converted.xml";
      link.click();
    } catch (err) {
      console.error("JSON to XML conversion failed", err);
      setConvertedOutput("Unexpected error during conversion.");
    }
  };





  return (
    <Container maxWidth="lg"  sx={{ mt: 4 }} ref={containerRef} >
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          fontSize: '2.5rem',
          background: 'linear-gradient(90deg, #ff416c, #ff4b2b, #1fa2ff, #12d8fa, #a6ffcb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
          mb: 4,
        }}
      >
        🚀 RestPilot – API Testing Tool
      </Typography>

      <Grid container spacing={3} sx={{ p: 3, borderRadius: 2, background: '#fdfdfd', boxShadow: 3 }}>
        {/* Method Selector */}
        <Grid item xs={12} sm={2}>
          <TextField
            select
            label="Method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
              '& label': {
                color: '#1fa2ff',
              },
            }}
          >
            {methods.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Request URL */}
        <Grid item xs={12} sm={10}>
          <TextField
            label="Request URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth={false} // Make it non-full-width to allow resizing
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                resize: 'horizontal', // Allow horizontal resize
                overflow: 'auto',
                minWidth: '300px', // Optional: Minimum width
                maxWidth: '100%',  // Optional: Max width
              },
            }}
            InputProps={{
              style: {
                resize: 'horizontal',
                overflow: 'auto',
              }
            }}
          />
        </Grid>




        {/* Auth Type Selector */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth sx={{ borderRadius: '12px' }}>
            <InputLabel sx={{ color: '#1fa2ff' }}>Auth Type</InputLabel>
            <Select
              value={authType}
              label="Auth Type"
              onChange={(e) => setAuthType(e.target.value)}
              sx={{
                borderRadius: '12px',
              }}
            >
              {authTypes.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>



        {/* Auth Value */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Token / API Key / Basic Auth"
            value={authValue}
            onChange={(e) => setAuthValue(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              },
            }}
          />
        </Grid>





        {/* Send Button */}
        <Grid item xs={12} sx={{ mt: -0.1, ml: 10 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSend}
            sx={{
              borderRadius: '30px',
              background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
              color: '#fff',
              fontWeight: 'bold',
              px: 5,
              py: 1.5,
              boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
              '&:hover': {
                background: 'linear-gradient(to right, #ff4b2b, #ff416c)',
              },
            }}
          >
            🚀 Send Request
          </Button>
        </Grid>

        {/* Headers Input */}

        <Grid item xs={12} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, mt: 2 }}>
            Request Headers
          </Typography>
          {headers.map((header, index) => (
            <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
              <Grid item xs={5}>
                <TextField
                  label="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, "key", e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  label="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, "value", e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={2}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeHeader(index)}
                  sx={{ minWidth: 0, px: 1, borderRadius: '12px' }}
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}
          <Button
            variant="contained"
            onClick={addHeader}
            sx={{
              borderRadius: '20px',
              background: 'linear-gradient(to right, #1fa2ff, #12d8fa, #a6ffcb)',
              color: '#fff',
              fontWeight: 'bold',
              mt: 1,
              '&:hover': {
                background: 'linear-gradient(to right, #12d8fa, #1fa2ff)',
              },
            }}
          >
            + Add Header
          </Button>
        </Grid>

        {/* Request Body */}
        <Grid item xs={12}>
          <div>
            {/* Range sliders */}
            <Box sx={{ display: 'flex', gap: 4, mb: 2, alignItems: 'center' }}>
              <div>
                <label>Height: {height}px</label><br />
                <input
                  type="range"
                  min="300"
                  max="1000"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </div>
              <div>
                <label>Width: {width}px</label><br />
                <input
                  type="range"
                  min="300"
                  max="1200"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </div>
            </Box>

            {/* Editor Box */}
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: '10px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                height: `${height}px`,
                width: `${width}px`,
              }}
            >
              <Editor
                language="json"
                value={body}
                onChange={(value) => setBody(value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: 'monospace',
                  formatOnPaste: true,
                  formatOnType: true,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                }}
                theme="vs-dark"
              />
            </Box>
          </div>

          {/* Upload Button */}
          <Button
            variant="contained"
            component="label"
            sx={{
              mt: 2,
              borderRadius: '20px',
              background: 'linear-gradient(to right, #1fa2ff, #12d8fa, #a6ffcb)',
              color: '#fff',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(to right, #12d8fa, #1fa2ff)',
              },
            }}
          >
            Upload JSON/XML File
            <input
              type="file"
              accept=".json,.xml"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setBody(event.target.result);
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </Button>



        </Grid>

      </Grid>


      {response && (
        <Paper elevation={4} sx={{ mt: 4, p: 2 }} ref={4 === 4 ? targetRef : null}  >
          <Tabs
            value={tabIndex}
            onChange={(e, v) => setTabIndex(v)}
            variant="fullWidth"
            textColor="inherit"
            TabIndicatorProps={{
              style: {
                background: ["#00bcd4", "#ab47bc", "#66bb6a", "#ef5350"][tabIndex],
                height: 4,
              },
            }}
          >
            <Tab label="Pretty" sx={{ color: tabIndex === 0 ? "#00bcd4" : "black" }} />
            <Tab label="Raw" sx={{ color: tabIndex === 1 ? "#ab47bc" : "black" }} />
            <Tab label="Headers" sx={{ color: tabIndex === 2 ? "#66bb6a" : "#black" }} />
            <Tab label="Status" sx={{ color: tabIndex === 3 ? "#ef5350" : "#black" }} />
          </Tabs>
          <Box sx={{ mt: 2 }}>
            {tabIndex === 0 && (
              typeof response.contentType === "string" && response.contentType.startsWith("image/") ? (
                <img
                  src={response.data}
                  alt="API Response"
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
              ) :

                <>
                  <Editor
                    language="json"
                    value={
                      typeof response.data === "string"
                        ? response.data
                        : JSON.stringify(response.data, null, 2)
                    }
                    onChange={() => { }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: 'monospace',
                      formatOnPaste: true,
                      formatOnType: true,
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      readOnly: true, // read-only since it's just for viewing
                    }}
                    theme="vs-dark"
                    height="300px"
                  />

                </>

            )}
            {tabIndex === 1 && (
              <pre
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  textAlign: "left",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  borderRadius: 4,
                }}
              >
                {typeof response.data === "string"
                  ? response.data
                  : JSON.stringify(response.data, null, 2)}
              </pre>
            )}
            {tabIndex === 2 && (
              <pre
                style={{
                  maxHeight: 300,
                  overflowY: "auto",
                  textAlign: "left",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  borderRadius: 4,
                }}
              >
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            )}
            {tabIndex === 3 && (
              <pre
                style={{
                  maxHeight: 100,
                  overflowY: "auto",
                  textAlign: "left",
                  margin: 0,
                  borderRadius: 4,
                }}
              >
                {response.status}
              </pre>
            )}
          </Box>

          <Box
            sx={{
              mt: 4,
              display: "flex",
              flexWrap: "wrap",
              gap: 3,
              alignItems: "center",
              justifyContent: "flex-start",
              p: 2,
              background: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
              borderRadius: 3,
              boxShadow: 3,
            }}
          >
            {/* Download Buttons */}
            <Tooltip title="Download as JSON">
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => download("json")}
                sx={{
                  background: "linear-gradient(45deg, #00bcd4 30%, #2196f3 90%)",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  "&:hover": {
                    background: "linear-gradient(45deg, #2196f3 30%, #00bcd4 90%)",
                  },
                }}
              >
                JSON
              </Button>
            </Tooltip>

            <Tooltip title="Download as XML">
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => download("xml")}
                sx={{
                  background: "linear-gradient(45deg, #ab47bc 30%, #8e24aa 90%)",
                  color: "#fff",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  "&:hover": {
                    background: "linear-gradient(45deg, #8e24aa 30%, #ab47bc 90%)",
                  },
                }}
              >
                XML
              </Button>
            </Tooltip>

            {/* Convert Buttons */}
            <Tooltip title="Convert only works for XML responses">
              <Button
                variant="outlined"
                onClick={handleXmlToJson}
                sx={{
                  borderColor: "#81d4fa",
                  color: "#81d4fa",
                  fontWeight: 600,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "#81d4fa",
                    color: "#000",
                  },
                }}
              >
                XML ➜ JSON
              </Button>
            </Tooltip>

            <Tooltip title="Convert only works for JSON responses">
              <Button
                variant="outlined"
                onClick={handleJsonToXml}
                sx={{
                  borderColor: "#ce93d8",
                  color: "#ce93d8",
                  fontWeight: 600,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "#ce93d8",
                    color: "#000",
                  },
                }}
              >
                JSON ➜ XML
              </Button>
            </Tooltip>
          </Box>

        </Paper>
      )}
      <style>
        {`
          .json-key { color: #d73a49; }
          .json-string { color: #032f62; }
          .json-number { color: #005cc5; }
          .json-boolean { color: #e36209; }
          .json-null { color: #6a737d; }
        `}
      </style>

    </Container>
  );
}
