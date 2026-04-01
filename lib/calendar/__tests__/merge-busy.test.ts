import { describe, it, expect } from 'vitest'
import { mergeIntervals, type TimeInterval } from '../merge-busy'

describe('mergeIntervals', () => {
  it('空配列を渡すと空配列を返す', () => {
    expect(mergeIntervals([])).toEqual([])
  })

  it('インターバル1つならそのまま返す', () => {
    const intervals: TimeInterval[] = [{ start: 100, end: 200 }]
    expect(mergeIntervals(intervals)).toEqual([{ start: 100, end: 200 }])
  })

  it('重なるインターバルをマージする', () => {
    const intervals: TimeInterval[] = [
      { start: 100, end: 300 },
      { start: 200, end: 400 },
    ]
    expect(mergeIntervals(intervals)).toEqual([{ start: 100, end: 400 }])
  })

  it('隣接するインターバルをマージする', () => {
    const intervals: TimeInterval[] = [
      { start: 100, end: 200 },
      { start: 200, end: 300 },
    ]
    expect(mergeIntervals(intervals)).toEqual([{ start: 100, end: 300 }])
  })

  it('重ならないインターバルはそのまま返す', () => {
    const intervals: TimeInterval[] = [
      { start: 100, end: 200 },
      { start: 300, end: 400 },
    ]
    expect(mergeIntervals(intervals)).toEqual([
      { start: 100, end: 200 },
      { start: 300, end: 400 },
    ])
  })

  it('ソートされていなくても正しくマージする', () => {
    const intervals: TimeInterval[] = [
      { start: 300, end: 400 },
      { start: 100, end: 250 },
      { start: 200, end: 350 },
    ]
    expect(mergeIntervals(intervals)).toEqual([{ start: 100, end: 400 }])
  })

  it('複数グループに分かれるケースを正しく処理する', () => {
    const intervals: TimeInterval[] = [
      { start: 100, end: 200 },
      { start: 150, end: 250 },
      { start: 400, end: 500 },
      { start: 450, end: 600 },
    ]
    expect(mergeIntervals(intervals)).toEqual([
      { start: 100, end: 250 },
      { start: 400, end: 600 },
    ])
  })

  it('完全に包含されるインターバルを正しく処理する', () => {
    const intervals: TimeInterval[] = [
      { start: 100, end: 500 },
      { start: 200, end: 300 },
    ]
    expect(mergeIntervals(intervals)).toEqual([{ start: 100, end: 500 }])
  })
})
