const Jimp = require('jimp');

// super basic algorithm with color cells
// 1. break source image into cells with average colors
// 2. build mosaic of average colors
Jimp.read("input.jpg")
  .then(processImage)
  .catch(handleReadError);

function processImage(image) {
  // generate data structure of cells with avg color
  const cellSize = 20;
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
  mosaic.write('mosaic.jpg');
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
