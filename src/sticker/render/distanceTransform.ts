interface BinaryMask {
  width: number
  height: number
  data: Uint8ClampedArray
}

// 有限哨兵避免抛物线交点计算出现 Infinity - Infinity。
const DISTANCE_INF = 1e15

/** 到最近前景像素的欧氏距离平方，供圆形描边使用。 */
export function computeSquaredDistanceTransform(mask: BinaryMask): Float32Array {
  const { width, height } = mask
  const size = width * height
  const distances = new Float32Array(size)

  // 各行列复用同一组工作缓冲区。
  const maxDim = Math.max(width, height)
  const column = new Float32Array(maxDim)
  const columnDistances = new Float32Array(maxDim)
  const vertices = new Int32Array(maxDim)
  const boundaries = new Float32Array(maxDim + 1)

  // 先沿列计算，再沿行计算平方距离。
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      column[y] = mask.data[y * width + x] > 0 ? 0 : DISTANCE_INF
    }

    transformDistanceAxis(column, height, columnDistances, vertices, boundaries)

    for (let y = 0; y < height; y += 1) {
      distances[y * width + x] = columnDistances[y]
    }
  }

  // 横向逐行更新距离。
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width
    for (let x = 0; x < width; x += 1) {
      column[x] = distances[rowOffset + x]
    }

    transformDistanceAxis(column, width, columnDistances, vertices, boundaries)

    for (let x = 0; x < width; x += 1) {
      distances[rowOffset + x] = columnDistances[x]
    }
  }

  return distances
}

function transformDistanceAxis(
  source: Float32Array,
  length: number,
  target: Float32Array,
  vertices: Int32Array,
  boundaries: Float32Array,
): void {
  let hullSize = 0

  vertices[0] = 0
  boundaries[0] = -DISTANCE_INF
  boundaries[1] = DISTANCE_INF

  for (let position = 1; position < length; position += 1) {
    let intersection = calculateSeparation(source, position, vertices[hullSize])

    while (intersection <= boundaries[hullSize]) {
      hullSize -= 1
      intersection = calculateSeparation(source, position, vertices[hullSize])
    }

    hullSize += 1
    vertices[hullSize] = position
    boundaries[hullSize] = intersection
    boundaries[hullSize + 1] = DISTANCE_INF
  }

  hullSize = 0

  for (let position = 0; position < length; position += 1) {
    while (boundaries[hullSize + 1] < position) {
      hullSize += 1
    }

    const distance = position - vertices[hullSize]
    target[position] = distance * distance + source[vertices[hullSize]]
  }
}

function calculateSeparation(source: Float32Array, current: number, previous: number): number {
  return (
    (source[current] + current * current - (source[previous] + previous * previous)) /
    (2 * current - 2 * previous)
  )
}
