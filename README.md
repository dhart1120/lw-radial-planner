# Last War Radial Planner

This app is a simple planning tool for the mobile game [Last War: Survival](https://www.lastwar.com/). The game is primarily a base-building and strategy game, with time management as a central component. This app allows users to **plan lists of upgrades and the time required to complete them.** Completing upgrades during specific time periods or on certain days of the week is a key mechanic of the game, and the math can become tricky when managing **multiple queues and concurrent upgrades**.

[Demo Link](http://radial-planner-demo.s3-website.us-east-2.amazonaws.com/)

![Screenshots](/docs/images/screenshot.png "Screenshots")

## Setup

This is a React + TypeScript app created with Vite. Components are built using shadcn and tailwindcss. It doesn't require a backend server and uses `localStorage` for user data. Typical use cases only need to retain data for a few hours up to a few weeks.

```shell
# install dependencies
npm install

# start the development server with hot module swapping
npm run dev

# create the /dist folder for deployment
npm run build

# preview the production build
npm run preview
```

## Future Ideas

A list of potential features that would improve the app:

* Include “Build Now” and “Research Now” charges based on total build time
  * Configure completion time to include these for new tasks
  * Allow a user to apply a charge to an in-progress task
* Button/modal to update a task’s settings after it has been added to a queue
* Improve the model so the number of builders / research centers affects concurrent tasks
* More useful support for the Schedule tab
* Improved entry method for **precision**
* **Fix:** Modals don't close on selection/update
