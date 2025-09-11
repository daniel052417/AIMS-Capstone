const express = require('express');
const app = express();
const PORT = 3002; // Different port

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

