import Chance from 'chance'

export const chance = new Chance()

export function chanceArrayItem<T>(arr: Array<T>): T {
  return arr[chance.integer({ min: 0, max: arr.length - 1 })]
}