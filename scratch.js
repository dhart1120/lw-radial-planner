/*
                    baseTime    with role   bonus only
weapon training 4   7d 11h 40m  2d 10h 3m   2d 21h 14m
advanced armor 4    4d 16h 18m  1d 12h 17m  1d 19h 16m
incentive - building    9d 7h 11m   3d 0h 6m    3d 14h 0m
weapon training 7   1d 20h 55m  14h 30m 17h 18m
gathering coins 4   1d 9h 2m    10h 40m 12h 43m
unit x  27d 18h 24m 8d 23h 18m  10d 16h 48m

*/

const techResearchSpeedup = 78.5;

const examples = [
    [[7, 11, 40], [2, 10, 3], [2, 21, 14]],
    [[4, 16, 18], [1, 12, 17], [1, 19, 16]]
]


const examplesInMinutes = examples.map(example => {
    return example.map(([days, hours, minutes]) => {
    return (days * 24 * 60) + (hours * 60) + minutes;
})});


const matrix = examplesInMinutes.map(example => {
    const [baseTime, withRoleAndBonus, withBonusOnly] = example;
    return [withBonusOnly, withRoleAndBonus, baseTime]
})

console.log(matrix)

