const { createHmac } = require('crypto');
const { Telnet } = require('telnet-client');

function generateAnswer({ challenge }) {
  let username = "dyckerhoff"
  let password = "dyckerhoff"
  challenge = atob(challenge)
  const digest = createHmac('md5', password)
    .update(challenge)
    .digest('hex');
  const hash = btoa(`${username} ${digest}`)
  return hash

}

const authCmd = 'AUTH -SASL CRAM-MD5'
const gprsCMD = 'GPRS ON'

async function sendAndWaitForData({ connection, cmd }) {
  await connection.write(`${cmd}\n`)
  res = await connection.nextData()
  return res
}


async function runTelnet() {
  const connection = new Telnet()
  const params = {
    host: 'dyhvs107.dy.droot.org',
    port: 27,
    negotiationMandatory: false,
    timeout: 1500,
    irs: '',
    echoLines: 0
  }

  await connection.connect(params)

  let res = await connection.nextData()
  res = res ? await sendAndWaitForData({ connection, cmd: authCmd }) : console.log(error);;
  const challenge = res.split(' ')[1]
  const hash = generateAnswer({ challenge })
  res = hash ? await sendAndWaitForData({ connection, cmd: hash }) : console.log(error);
  res = res ? await sendAndWaitForData({ connection, cmd: gprsCMD }) : console.log(error);;
  connection.on('data', prompt => {
    connection.send('', { ors: '', maxBufferLength: '5M' }, (err, response) => {
      const data = response.toString().split('^M^J')
      //console.log(data);
      loopOverArr(data)
    })
  })

}

runTelnet();



// 50.115953, 8.742201
const re = /GPRMD/m
const re1 = /\$(.*)\$/m
const re2 = /A,(.*),N,(.*),E/g
const re3 = /(.*)(\d\d)\./m
const re4 = /\.(.*)/m
const input = '1060 $fm169$GPRMD,134050.000,A,5006.95538,N,844.53146,E,0.6,0.0,021222,257,9,10,22,,,,,*28'

function getData(input) {
  if (input.match(re)[0]) {
    const vehicle = input.match(re1)[1] || ''
    for (const match of input.matchAll(re2)) {
      const data = {
        vehicle,
        north: match[1],
        east: match[2],
      }
      return data
    }
  }
}

function DMM2DD({ DMM }) {
  const degrees = parseInt(DMM.match(re3)[1])
  const minutes = parseInt(DMM.match(re3)[2].replace('0', ''));
  const seconds = parseFloat(`.${DMM.match(re4)[1]}`);
  const decimalDegress = degrees + (minutes + seconds) / 60
  return decimalDegress;
}

function getCoordinates(input) {
  const { vehicle, north, east } = getData(input);
  const lat = DMM2DD({ DMM: north })
  const lng = DMM2DD({ DMM: east })
  return { vehicle, lat, lng }
}

function loopOverArr(arr) {
  try {
    for (const key in arr) {
      console.log(getCoordinates(arr[key]));
    }
  } catch (error) {
  }
}

