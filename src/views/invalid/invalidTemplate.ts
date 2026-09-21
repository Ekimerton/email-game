export const INVALID_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}
.container {
  width: 100%;
  max-width: 480px;
  text-align: center;
}
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
.logo-tiles {
  display: inline-flex;
  padding: 4px 0;
}
.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 18px;
  font-weight: 800;
  border-radius: 6px;
  border: 2px solid #18181b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.rotate-neg {
  background-color: #D8FFC5;
  color: #18181b;
  transform: rotate(-8deg);
  margin-right: -4px;
}
.rotate-pos {
  background-color: #C4F7CA;
  color: #18181b;
  transform: rotate(8deg);
  margin-right: -4px;
}
.icon {
  font-size: 38px;
  margin-bottom: 12px;
}
h1 {
  font-size: 24px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
p {
  font-size: 14.5px;
  color: #52525b;
  line-height: 1.5;
  margin-bottom: 24px;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}
.btn {
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  white-space: nowrap;
  background-color: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.btn:hover {
  background-color: #bbf4c3;
  border-color: #76c87c;
  box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
}
.btn:active {
  transform: scale(0.99);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
`;

export const INVALID_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invalid Link - Inboxed</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&display=swap">
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}
.container {
  width: 100%;
  max-width: 480px;
  text-align: center;
}
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
.logo-tiles {
  display: inline-flex;
  padding: 4px 0;
}
.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 18px;
  font-weight: 800;
  border-radius: 6px;
  border: 2px solid #18181b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.rotate-neg {
  background-color: #D8FFC5;
  color: #18181b;
  transform: rotate(-8deg);
  margin-right: -4px;
}
.rotate-pos {
  background-color: #C4F7CA;
  color: #18181b;
  transform: rotate(8deg);
  margin-right: -4px;
}
.icon {
  font-size: 38px;
  margin-bottom: 12px;
}
h1 {
  font-size: 24px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
p {
  font-size: 14.5px;
  color: #52525b;
  line-height: 1.5;
  margin-bottom: 24px;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}
.btn {
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  white-space: nowrap;
  background-color: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.btn:hover {
  background-color: #bbf4c3;
  border-color: #76c87c;
  box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
}
.btn:active {
  transform: scale(0.99);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}</style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <div class="logo-tiles" aria-label="INBOXED">
        <span class="logo-tile rotate-neg">I</span>
        <span class="logo-tile rotate-pos">N</span>
        <span class="logo-tile rotate-neg">B</span>
        <span class="logo-tile rotate-pos">O</span>
        <span class="logo-tile rotate-neg">X</span>
        <span class="logo-tile rotate-pos">E</span>
        <span class="logo-tile rotate-neg">D</span>
      </div>
    </div>

    <div class="icon">⚠️</div>
    <h1>Link Expired or Invalid</h1>
    <p>
      This confirmation link is invalid or has expired. Please enter your email on the homepage to request a new link.
    </p>
    <a href="/" class="btn">Back to Home</a>
  </div>
</body>
</html>
`;
