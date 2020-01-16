const commandLineArgs = require('command-line-args');
const Jimp = require('jimp');

const argDefinitions = [
  { name: 'cellSize', alias: 'c', type: Number },
  { name: 'source', alias: 's', type: String },
  { name: 'output', alias: 'o', type: String },
  { name: 'help', alias: 'h', type: Boolean }
]

const defaultArgs = {
  source: 'input.jpg',
  output: 'moasic.jpg',
  cellSize: 20
};
const args = { ...defaultArgs, ...commandLineArgs(argDefinitions) };

if (args.help) {
  console.log(`
    Usage:

    --source, -s: input file path
    --output, -o: output file path
    --cellSize, -c: size of mosaic cells
  `);
  return;
}

// super basic algorithm with color cells
// 1. break source image into cells with average colors
// 2. build mosaic of average colors
Jimp.read(args.source)
  .then(processImage)
  .catch(handleReadError);

function processImage(image) {
  // generate data structure of cells with avg color
  const cellSize = args.cellSize;
  const rawCells = [];

  // make a rawCells of cells
  // each cell has a list of all the pixels in it
  //   to average in a loop after this
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, index) => {
    channels = getPixelChannels(image.bitmap, index);

    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);

    // if the row and column don't exist yet, make them
    rawCells[row] = rawCells[row] || [];
    rawCells[row][col] = rawCells[row][col] || [];

    rawCells[row][col].push(channels);
  });

  // calculate the average color for each cell
  const averageColorCells = [];
  rawCells.forEach(row => {
    const averageColorRow = [];
    row.forEach(col => {
      let redSum = 0;
      let greenSum = 0;
      let blueSum = 0;
      let alphaSum = 0;
      let pixelCount = 0;
      col.forEach(pixel => {
        redSum += pixel['red'];
        greenSum += pixel['green'];
        blueSum += pixel['blue'];
        alphaSum += pixel['alpha'];
        pixelCount++;
      });

      averageColorRow.push({
        red: redSum / pixelCount,
        green: greenSum / pixelCount,
        blue: blueSum / pixelCount,
        alpha: alphaSum / pixelCount
      });
    });
    averageColorCells.push(averageColorRow);
  });

  // make an image with the average color cells
  const mosaic = new Jimp(image.bitmap.width, image.bitmap.height)
  mosaic.scan(0, 0, mosaic.bitmap.width, mosaic.bitmap.height, (x, y, index) => {
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);

    setPixelChannels(mosaic.bitmap, index, averageColorCells[row][col]);
  });
  mosaic.write(args.output);
}

function getPixelChannels(bitmap, index) {
  return {
    red: bitmap.data[index],
    green: bitmap.data[index + 1],
    blue: bitmap.data[index + 2],
    alpha: bitmap.data[index + 3]
  }
}

function setPixelChannels(bitmap, index, channels) {
  bitmap.data[index] = channels['red'];
  bitmap.data[index + 1] = channels['green'];
  bitmap.data[index + 2] = channels['blue'];
  bitmap.data[index + 3] = channels['alpha'];
}

function handleReadError(err) {
  console.error(err);
}
