(function ()
{
    'use strict';

    angular
        .module('app.calendar')
        .factory('activityCalendarService', activityCalendarService);

    /** @ngInject */
    function activityCalendarService($filter) {
        return {
            mapUsersActivity: mapUsersActivity,
            setActivitiesPositions: setActivitiesPositions,
            setAvailabilitiesData: setAvailabilitiesData
        }

        /**
         * Merge array of activities into users' activities
         *
         * @param {Activity[]} activities response from
         * `integrations/time_tracking/activities` endpoint
         */
        function mapUsersActivity(activities) {
            // group thorugh activity.user_id
            var grouped = {};
            angular.forEach(activities, function (activity) {
                grouped[activity.user_id] ?
                    grouped[activity.user_id].push(activity) :
                    grouped[activity.user_id] = [activity];
            });
            // make model: [ user: { ..., activities: [] }, ... ];
            var users = [];
            angular.forEach(Object.keys(grouped), function (userId) {
                var user = grouped[userId][0].user.data;
                if (user) {
                    user.activities = mergeActivities(grouped[userId]);
                    user.tracked = getTrackedSummary(grouped[userId]);
                    users.push(user);
                }
            });

            return users;
        }

        /**
         * Merge single user activities through ticket id
         * @param {Activity[]} activities
         * @return {UserWithActivities}
         */
        function mergeActivities(activities) {
            var result = [];
            angular.forEach(activities, function (curr) {
                // get the last from the results
                var prev = result[result.length - 1];
                // add first activity to result
                if (!prev) {
                    curr = createNewMergedActivity(curr);
                    result.push(curr);
                } else {
                    // check that activity could be merged with previous
                    // and merge them if the same: project, ticket
                    // and it's time is continious (prev.end === curr.start)
                    if (
                        prev.project_id == curr.project_id &&
                        prev.ticket_id == curr.ticket_id &&
                        prev.utc_finished_at == curr.utc_started_at
                    ) {
                        // extend previous activity object data
                        // with merged - current activity data
                        prev.ids += ',' + curr.id;
                        prev.items.push(removeDuplicatedData(curr));
                        prev.utc_finished_at = curr.utc_finished_at;

                        prev.tracked += curr.tracked;
                        prev.activity_level = (prev.activity_level + curr.activity_level) / 2;
                        prev.comments = mergeComments(prev.comments, curr.comment);
                        prev.notes = mergeNotes(prev.notes, curr.time_tracking_note);
                    } else {
                        // activity is different than previous
                        curr = createNewMergedActivity(curr);
                        result.push(curr);
                    }

                }
            });

            return result;
        }

        /**
         * Create new "merged" activity with group statistics
         * and activities ready to use array
         *
         * @param {Activity[]} activities
         * @return {MergedActivity} merged activity
         */
        function createNewMergedActivity(activity) {
            return {
                // activity "identifying" data
                project_id: activity.project_id,
                ticket_id: activity.ticket_id,
                utc_started_at: activity.utc_started_at,
                utc_finished_at: activity.utc_finished_at,
                // merged items data (summary)
                tracked: activity.tracked,
                activity_level: activity.activity_level,
                comments: mergeComments([], activity.comment),
                notes: mergeNotes([], activity.time_tracking_note),
                // helpers
                project: activity.project_id ? activity.project.data : null,
                ticket: activity.ticket_id ? activity.ticket.data : null,
                // ids of merged items divided by comma for "indexind" purposes
                ids: activity.id,
                items: [removeDuplicatedData(activity)]
            };
        }

        /**
         * Removes single activity item data
         * that is present in MergedActivity
         *
         * @param {Activity} activity
         * @return {Activity} without user, project and ticket objects
         */
        function removeDuplicatedData(activity) {
            delete activity.user;
            delete activity.project;
            delete activity.ticket;
            return activity;
        }

        /**
         *
         * @param {string[]} comments
         * @param {string} comment
         * @return comments
         */
        function mergeComments(comments, comment) {
            if (!comment.length) return comments;
            // add comment
            comments.push(comment);
            // unique filter
            return comments.filter(function (value, index, self) {
                return self.indexOf(value) === index && value != '';
            });
        }

        /**
         *
         * @param {string[]} notes
         * @param {string} note
         * @return notes
         */
        function mergeNotes(notes, note) {
            if (!note || !note.data || !note.data.content) return notes;
            // add comment
            notes.push(note.data.content);
            // unique filter
            return notes.filter(function (value, index, self) {
                return self.indexOf(value) === index && value != '';
            });
        }


        /**
         * Get sum of activities tracked times
         * @param {Activity[]} activities
         * @return {number}
         */
        function getTrackedSummary(activities) {
            var result = 0;
            angular.forEach(activities, function (activity) {
                result += activity.tracked;
            });
            return result;
        }

        /**
         * Sets activities position params to display
         * elements properly in time
         * @param {UserWithActivities} activities
         * @param {number} hourHeight
         * @param {number} colWidth
         * @return {UserWithPositionedActivities}
         */
        function setActivitiesPositions(activities, hourHeight, colWidth) {
            // set vertical position in day-time
            angular.forEach(activities, function (user) {
                angular.forEach(user.activities, function (activity) {
                    // set top - distance from the beggining of the day
                    var hour = parseInt($filter('utcToLocal')(activity.utc_started_at, 'H'));
                    var minute = parseInt($filter('utcToLocal')(activity.utc_started_at, 'm'));
                    activity.top = (hour * hourHeight) + Math.floor(minute * hourHeight / 60);
                    // set height - "3px" for spacing purposes
                    activity.height = (Math.floor((activity.tracked / 60) * hourHeight / 60)) - 3;
                    // min height of the item is 24px
                    activity.height = activity.height < 24 ? 24 : activity.height;
                });
            });

            // get activity "neighborhoods" (same vertical position, if many tasks in the same hour)
            angular.forEach(activities, function (user) {
                angular.forEach(user.activities, function (activity) {
                    activity.neighborhoods = findSameTimeActivities(activity, user.activities);
                });
            });

            // set horizontal position
            angular.forEach(activities, function (user) {
                var posFromRight = 0;
                angular.forEach(user.activities, function (activity) {
                    var position = 0;
                    // set neighourhood number from the largest from actiity neighourhood
                    // e.g. activity has 2 neighbors, but one of the neighbor has 3 neighbors
                    // so we have to divide activity to 3 neighbors
                    var neighborhoodNumber = activity.neighborhoods.length;
                    angular.forEach(activity.neighborhoods, function (neighbor) {
                        if (neighbor.neighborhoods.length > neighborhoodNumber) {
                            neighborhoodNumber = neighbor.neighborhoods.length;
                        }
                    });
                    if (neighborhoodNumber) {
                        position = neighborhoodNumber - posFromRight;
                        // Prevent from negative position (in some cases)
                        if (position < 0) {
                            posFromRight = 0
                            position = neighborhoodNumber - posFromRight;
                        }
                        posFromRight++;
                    }
                    if (neighborhoodNumber == 0 || neighborhoodNumber == (posFromRight - 1)) {
                        posFromRight = 0
                    }

                    var width = Math.floor(colWidth / (neighborhoodNumber + 1));
                    activity.right = position * width;
                    activity.width = width - 3;
                });
            });

            return activities;
        }

        /**
         * If from or to position of other element is within from or to of base element
         * element is clasified as "the same" and the width should be divided
         * @param {MergedActivity} activity
         * @param {MergedActivity[]} activities
         */
        function findSameTimeActivities(activity, activities) {
            var from = activity.top;
            var to = activity.top + activity.height;
            var result = [];

            // Some magic here :) sorry
            angular.forEach(activities, function(a) {
                var f = a.top;
                var t = a.top + a.height;
                if (
                    activity.ids !== a.ids &&
                    (
                        ((from <= f && to >= f) && (to <= t && from <= t)) ||
                        ((from >= f && from <= t) && (to >= f && to >= t)) ||
                        ((from >= f && from <=t) && (to <= t && to >= f))
                    )
                ) {
                    result.push(a);
                }
            });

            return result;
        }

        /**
         * Set availabilities param
         * @param {UserWithPositionedActivities} users
         * @param {UserAvailabilities} availabilities
         * @param {string} date
         * @param {number} hourHeight
         */
        function setAvailabilitiesData(users, availabilities, date, hourHeight) {
            angular.forEach(users, function (user) {
                user.availabilities = [];
                angular.forEach(availabilities, function(u) {
                    if (user.id == u.id && u.availabilities.data && u.availabilities.data.length) {
                        user.availabilities = mapAvailabilities(u.availabilities.data, date, hourHeight);
                    }
                })
            });
            return users;
        }

        /**
         * Filtering users' availabilities and setting their top and bottom positions
         * @param {UserAvailabilities} availabilities
         * @param {string} date
         * @param {number} hourHeight
         */
        function mapAvailabilities(availabilities, date, hourHeight) {
            return availabilities.filter(function (availability) {
                if (availability.day == date && availability.available == true) {
                    var start = availability.time_start.split(':');
                    var stop = availability.time_stop.split(':');
                    availability.top = (parseInt(start[0]) * hourHeight) + Math.floor(parseInt(start[1] * hourHeight / 60));
                    availability.height = (parseInt(stop[0]) * hourHeight) + Math.floor(parseInt(stop[1] * hourHeight / 60)) - availability.top;
                    return true;
                } else {
                    return false;
                }
            });
        }

    }

})();
