import path from "node:path";
import sharp from "sharp";

const frameDirectory = path.resolve("src/assets/lost");
const outputFile = path.join(frameDirectory, "ghost-sprite.png");
const frameFiles = Array.from({ length: 5 }, (_, index) =>
    path.join(frameDirectory, `lost${index + 1}.png`),
);
const frameMetadata = await Promise.all(
    frameFiles.map((file) => sharp(file).metadata()),
);
const frameWidth = frameMetadata[0].width;
const frameHeight = frameMetadata[0].height;

if (!frameWidth || !frameHeight) {
    throw new Error("Unable to read the ghost frame dimensions");
}

if (
    frameMetadata.some(
        ({ width, height }) => width !== frameWidth || height !== frameHeight,
    )
) {
    throw new Error("Ghost sprite frames must use identical dimensions");
}

await sharp({
    create: {
        width: frameWidth * frameFiles.length,
        height: frameHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
})
    .composite(
        frameFiles.map((input, index) => ({
            input,
            left: index * frameWidth,
            top: 0,
        })),
    )
    .png()
    .toFile(outputFile);

console.log(`Ghost sprite created at ${path.relative(process.cwd(), outputFile)}`);
