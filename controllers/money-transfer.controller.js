const fs = require('fs');
const jwt = require('jsonwebtoken');
const nodeRSA = require('node-rsa');
const hash = require('object-hash');
const axios = require('axios');

// RSA key-pair
const rsaPrivateKeyString = fs.readFileSync('rsa_private.key', 'utf8');
const rsaPublicKeyString = fs.readFileSync('rsa_public.key', 'utf8');

// load key from PEM string
const pubKeyRSA = new nodeRSA();
const priKeyRSA = new nodeRSA();

pubKeyRSA.importKey(rsaPublicKeyString);
priKeyRSA.importKey(rsaPrivateKeyString);

const auth_bank = ['RSA-bank', 'PGP-bank']; // just test
const secret = 'hiphopneverdie';

// implement
function checkSecurity(req, isMoneyAPI = false) {
  const { bank_code, sig, ts } = req.headers;
  // check partner code
  if (!auth_bank.includes(bank_code)) throw new Error('Your bankCode is not correct.');
  // check time in 1 minutes
  if (Date.now() - parseInt(ts) > 60) throw new Error('Time exceed.');
  // check signature. If money API then ignore check here
  if (isMoneyAPI) return;
  const sigString = bank_code + ts.toString() + JSON.stringify(req.body) + secret;
  const hashString = hash.MD5(sigString);
  console.log(hashString);
  if (sig !== hashString) throw new Error('Signature failed.');
}

function verifySig(req) {
  checkSecurity(req, true);
  const { bank_code, sig, ts } = req.headers;

  const sigString = bank_code + ts.toString() + JSON.stringify(req.body) + secret;
  const hashString = hash.MD5(sigString); // return hex encoding string

  // sign
  // const genSig = priKeyRSA.sign(hashString, 'hex', 'hex');
  // console.log('fds', genSig);

  // verify
  const verification_result = pubKeyRSA.verify(hashString, sig, 'hex', 'hex');
  if (!verification_result) {
    throw new Error('Verify your RSA signature failed.');
  }
}

function moneyTransfer() {}

const partners = {
  RSA_bank: {
    bank_code: 'RSA_bank',
    secret: 'hello',
  },
  PGP_bank: {
    bank_code: 'PGP_bank',
    secret: 'world',
  },
};
function getBankDetail(partner_code) {
  const data = {};
  const ts = Date.now().toString();
  const sigString = process.env.MY_BANK_CODE + ts + JSON.stringify(data) + partners[partner_code].secret;
  const sig = md5(sigString).toString();
  const headers = {
    bank_code,
    ts,
    sig,
  };

  const instance = axios.create({
    baseURL: 'http://localhost:3001/',
    timeout: 3000,
    headers,
  });
  instance.post('/', data).then((res) => {
    console.log(res);
  });
}

module.exports = {
  bankDetail: (req, res) => {
    let msg = '';
    try {
      checkSecurity(req);
      msg = 'SUCCESS bank-detail';
    } catch (err) {
      msg = `ERROR ${err.message}`;
    }
    res.send(`bank-detail API done. ${msg}`);
  },
  moneyTransfer: (req, res) => {
    let msg;
    try {
      verifySig(req);
      msg = 'SUCCESS verify-sig';
    } catch (err) {
      msg = `ERROR ${err.message}`;
    }
    res.send(`money-transfer API done. ${msg}`);
  },
  postMoneyTransfer: (req, res) => {
    console.log('post OK');
  },
};
