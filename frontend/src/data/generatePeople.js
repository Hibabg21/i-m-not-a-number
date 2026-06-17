export function generatePeople(count = 1000) {

  const people = []

  for (let i = 0; i < count; i++) {

    people.push({
      id: i,

      name: `Person ${i}`,

      age: Math.floor(Math.random() * 100),

      gender: Math.random() > 0.5 ? "Male" : "Female",

      // position عشوائية فالشاشة
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,

      story: "Memory node"
    })

  }

  return people
}