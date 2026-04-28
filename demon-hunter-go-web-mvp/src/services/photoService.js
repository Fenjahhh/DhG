const MAX_PHOTO_SIZE = 720;
const PHOTO_QUALITY = 0.72;

export async function createPhotoAttachment(file, fallbackLocation) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const photoDataUrl = await resizeImage(originalDataUrl);
  const gpsLocation = readGpsLocationFromJpeg(file, originalDataUrl);

  return {
    id: crypto.randomUUID(),
    dataUrl: photoDataUrl,
    location: gpsLocation ?? fallbackLocation,
    locationSource: gpsLocation ? 'photo' : 'current',
    createdAt: new Date().toISOString()
  };
}

export const fileToPhotoEntry = createPhotoAttachment;

export function normalizeNotePhotos(note) {
  if (Array.isArray(note.photos)) return note.photos;
  if (note.photoDataUrl) {
    return [
      {
        id: note.id ? `${note.id}-legacy-photo` : crypto.randomUUID(),
        dataUrl: note.photoDataUrl,
        location: note.location,
        locationSource: note.location ? 'current' : 'unknown',
        createdAt: note.createdAt ?? new Date().toISOString()
      }
    ];
  }
  return [];
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(new Error('Foto konnte nicht gelesen werden.')));
    reader.addEventListener('load', () => resolve(reader.result));
    reader.readAsDataURL(file);
  });
}

function resizeImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('error', () => reject(new Error('Foto konnte nicht verarbeitet werden.')));
    image.addEventListener('load', () => {
      const scale = Math.min(1, MAX_PHOTO_SIZE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', PHOTO_QUALITY));
    });
    image.src = dataUrl;
  });
}

function readGpsLocationFromJpeg(file, dataUrl) {
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) return null;

  try {
    const binary = atob(String(dataUrl).split(',')[1] ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return parseExifGps(bytes.buffer);
  } catch {
    return null;
  }
}

function parseExifGps(buffer) {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;
    if (marker === 0xffe1) {
      const length = view.getUint16(offset);
      const exifStart = offset + 2;
      if (readAscii(view, exifStart, 4) === 'Exif') {
        return parseTiffGps(view, exifStart + 6);
      }
      offset += length;
    } else {
      offset += view.getUint16(offset);
    }
  }
  return null;
}

function parseTiffGps(view, tiffStart) {
  const littleEndian = readAscii(view, tiffStart, 2) === 'II';
  const firstIfdOffset = readUint32(view, tiffStart + 4, littleEndian);
  const gpsIfdOffset = findTagValue(view, tiffStart + firstIfdOffset, 0x8825, littleEndian);
  if (!gpsIfdOffset) return null;

  const gpsIfd = tiffStart + gpsIfdOffset;
  const latRef = readTagAscii(view, gpsIfd, 1, littleEndian, tiffStart);
  const lat = readTagRationals(view, gpsIfd, 2, littleEndian, tiffStart);
  const lngRef = readTagAscii(view, gpsIfd, 3, littleEndian, tiffStart);
  const lng = readTagRationals(view, gpsIfd, 4, littleEndian, tiffStart);
  if (!latRef || !lat || !lngRef || !lng) return null;

  return {
    lat: dmsToDecimal(lat) * (latRef === 'S' ? -1 : 1),
    lng: dmsToDecimal(lng) * (lngRef === 'W' ? -1 : 1)
  };
}

function findTagValue(view, ifdOffset, tag, littleEndian) {
  const count = readUint16(view, ifdOffset, littleEndian);
  for (let index = 0; index < count; index += 1) {
    const entry = ifdOffset + 2 + index * 12;
    if (readUint16(view, entry, littleEndian) === tag) {
      return readUint32(view, entry + 8, littleEndian);
    }
  }
  return null;
}

function readTagAscii(view, ifdOffset, tag, littleEndian, tiffStart) {
  const entry = findTagEntry(view, ifdOffset, tag, littleEndian);
  if (!entry) return null;
  const count = readUint32(view, entry + 4, littleEndian);
  const valueOffset = count <= 4 ? entry + 8 : tiffStart + readUint32(view, entry + 8, littleEndian);
  return readAscii(view, valueOffset, count).replace(/\0/g, '');
}

function readTagRationals(view, ifdOffset, tag, littleEndian, tiffStart) {
  const entry = findTagEntry(view, ifdOffset, tag, littleEndian);
  if (!entry) return null;
  const offset = tiffStart + readUint32(view, entry + 8, littleEndian);
  return [0, 1, 2].map((index) => {
    const base = offset + index * 8;
    const numerator = readUint32(view, base, littleEndian);
    const denominator = readUint32(view, base + 4, littleEndian);
    return denominator ? numerator / denominator : 0;
  });
}

function findTagEntry(view, ifdOffset, tag, littleEndian) {
  const count = readUint16(view, ifdOffset, littleEndian);
  for (let index = 0; index < count; index += 1) {
    const entry = ifdOffset + 2 + index * 12;
    if (readUint16(view, entry, littleEndian) === tag) return entry;
  }
  return null;
}

function dmsToDecimal([degrees, minutes, seconds]) {
  return degrees + minutes / 60 + seconds / 3600;
}

function readAscii(view, offset, length) {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join('');
}

function readUint16(view, offset, littleEndian) {
  return view.getUint16(offset, littleEndian);
}

function readUint32(view, offset, littleEndian) {
  return view.getUint32(offset, littleEndian);
}
