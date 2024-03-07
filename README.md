# Agile Board

This repository contains only the frontend codebase, that is the web ui side of the system.
Please see other repositories to find the backend API and Time Tracking app

## About AgileBoard
AgileBoard is an innovative, open-source project management web application designed to streamline the complexities of <b>project and task management</b> for teams of any size. At its core, AgileBoard offers a dynamic platform for creating, organizing, and tracking tickets across various milestones or sprints, enabling teams to focus on what matters most - delivering value.

With the Agile board, teams can visualize their active sprints in a fully customizable interface, adapting the board to fit the unique workflow and processes of each project. This visual representation not only simplifies project oversight but also enhances team collaboration and productivity by providing a clear overview of task progress and dependencies.

AgileBoard goes beyond traditional project management tools by incorporating a Knowledge Base module. This feature allows teams to curate and access vital project-related articles, documents, and information, ensuring that valuable insights and resources are always within reach.

Understanding the importance of efficient resource management, AgileBoard includes a comprehensive calendar module. This tool assists in scheduling, planning, and managing team members, facilitating optimal allocation of human resources across tasks and projects.

The latest addition to AgileBoard's suite of features is the <b>time tracking</b> capability. Users can now effortlessly record their work hours manually or utilize the convenience of our computer and mobile applications for automatic time logging. This feature not only enhances project billing and accounting practices but also provides invaluable data for analyzing productivity and optimizing workflows.

AgileBoard is more than a project management tool; it's a companion in your journey towards agile excellence. By embracing AgileBoard, teams can harness the power of agility, collaboration, and information to drive project success and achieve their goals.

#### AgileBoard tech stack:
backend: PHP / Laravel framwework
frontend: AngularJS
time tracking app: Angular electron
time tracking mobile app : Xamarin

### SPONSORS
### **[Denkkraft](https://denkkraft.eu/)**

### Security Vulnerabilities
If you discover a security vulnerability within Laravel, please send an e-mail to [opensource@denkkraft.eu](mailto:opensource@denkkraft.eu) . All security vulnerabilities will be promptly addressed.

# License
The Agile Board is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT)

# HOW TO RUN

### Prerequisites

In order to run the application you need to setup server with:

- node.js (with npm) version 14.21.3
- gulp
- bower

### Installation

0. Go to /angular directory

1. npm install -g bower

2. npm install -g gulp

3. In /angular run commands:

    - to install npm modules and bower components:

    ```
    npm install
    ```
    
    ```
    bower install
    ```

6. To run local server run command:

    ```
    npm start
    ```

### Bulding app

Make changes to src/index.html:

1. In development environment

    ```
    <!-- build:js(src) scripts/vendor.js -->
    <!-- bower:js -->
    <!-- run `gulp inject` to automatically populate bower script dependencies -->
    <!-- endbower -->
    <!-- endbuild -->
    <!-- build:js({.tmp/serve,.tmp/partials,src}) scripts/app.js -->
    <!-- inject:js -->
    <!-- js files will be automatically insert here -->
    <!-- endinject -->
    <!-- inject:partials -->
    <!-- angular templates will be automatically converted in js and inserted here -->
    <!-- endinject -->
    <!-- endbuild -->
    ```

2. In production environment

    ```
    <!-- inject:js -->
    <!-- js files will be automatically insert here -->
    <!-- endinject -->
    ```

In order to build app, which will be served from /dist, you must run commad from /angular:

1. In development environment

    ```
    npm build
    ```

2. In production environment

    ```
    npm build
    ```

