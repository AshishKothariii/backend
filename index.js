const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const Rates = require("./models/Rates");

const app = express();
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }));
const port = process.env.PORT || 3000; // Use PORT from environment or default to 3000
const axios = require("axios");

mongoose.connect(process.env.MONGO_URL);

app.use(express.json());
app.use(cors(process.env.CLIENT_URL));

app.get("/", async (req, res) => {
  res.send("hello");
});
app.get("/rates", async (req, res) => {
  const rates = (await axios.get(process.env.API)).data.rates;
  console.log(rates);

  res.send({ hello: rates });
});
app.post("/conversion", async (req, res) => {
  const amount = req.body.amount;
  const baseCurrency = req.body.baseCurrency;
  const convertedCurrency = req.body.convertedCurrency;
  const currentTime = new Date();
  let latestDocument = await Rates.findOne({}, {}, { sort: { createdAt: -1 } });
  let latestDocumentTimestamp = latestDocument.createdAt;
  let timeDifference = currentTime - latestDocumentTimestamp;
  const oneHourInMilliseconds = 3600000;
  let convertedvalue;
  if (timeDifference > oneHourInMilliseconds) {
    const rate_list = await axios.get(process.env.API);
    const rates = rate_list.data.rates;
    Rates.create(rates);
    latestDocument = await Rates.findOne({}, {}, { sort: { createdAt: -1 } });
    latestDocumentTimestamp = latestDocument.createdAt;

    timeDifference = new Date() - latestDocumentTimestamp;
  }
  convertedvalue = await getrates();

  async function getrates() {
    return (
      (latestDocument[convertedCurrency] * amount) /
      latestDocument[baseCurrency]
    );
  }
  res.send({
    convertedvalue: convertedvalue,
    lastupdated: Math.floor(timeDifference / 60000),
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
