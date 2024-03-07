/* 
  This file contains copied legacy code for task handling from /src/main/ticket/ticket.controller.js.
  Ideally this should be rewritten to proper clean code.
*/

export class TaskLegacy {

  constructor(
    private ticket,
    private projectsService,
    private api,
    private textareaSanitizerService,
  ) { }

  update = function(param, new_value, successCallback?, apiErrorCallback?) {
    switch (param) {
      case 'name':
        this.ticket.name = new_value;
        break;
      case 'assigned_user':
        this.ticket.assigned_id = (new_value && new_value.id) ? new_value.id : null;
        this.ticket.assigned_user.data = new_value;
        break;
      case 'reporting_user':
        this.ticket.reporter_id = (new_value && new_value.id) ? new_value.id : null;
        break;
      case 'estimate_time':
        this.ticket.estimate_time = this.projectsService.estimationToSeconds(new_value);
        break;
      case 'scheduled_time_start':
        if (new_value && new_value != '')
          // @ts-ignore
          this.ticket.scheduled_time_start = moment(new_value).format('YYYY-MM-DD HH:mm:ss');
        else
          this.ticket.scheduled_time_start = null;
        break;
      case 'scheduled_time_end':
        if (new_value && new_value != '')
          // @ts-ignore
          this.ticket.scheduled_time_end = moment(new_value).format('YYYY-MM-DD HH:mm:ss');
        else
          this.ticket.scheduled_time_end = null;
        break;
      case 'stories':
        this.ticket.stories.data = new_value;
        break;
      case 'description':
        this.ticket.description = new_value;
        break;
      case 'type':
        this.ticket.type_id = new_value;
        break;
      case 'sprint':
        this.ticket.sprint_id = new_value;
        break;
      case 'parent_tickets':
        this.ticket.parent_ticket_ids = new_value.map(function (t) {
          return t.id;
        });
        break;
      case 'sub_tickets':
        this.ticket.sub_ticket_ids = new_value.map(function (t) {
          return t.id;
        });
        break;
      case 'status':
        this.api.ticket.changePriority.put({
          project_id: this.ticket.project_id,
          id: this.ticket.id,
          status_id: new_value,
          before_ticket_id: this.ticket.status_id == new_value ? this.ticket.id : null
        },
          function () {
            // loadTicket();
            if (typeof successCallback != 'undefined') successCallback();
          },
          function (response) {
            if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
          }
        );
        return;
    }

    this.convertStoriesToIds();

    // send request to API
    this.api.ticket.ticket.put(this.ticket,
      // refresh data on success
      function () {
        // loadTicket();
        if (typeof successCallback != 'undefined') successCallback();
      },
      function (response) {
        console.error(response);
        if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
      }
    );
  }.bind(this);

  /**
   * @description Convert stories objects into stories ids
   */
  convertStoriesToIds() {
    this.ticket.story_id = [];

    if (!this.ticket.stories.data.length) return;

    // @ts-ignore
    this.ticket.stories.data.forEach(story => {
      this.ticket.story_id.push(story.id);
    });
  }

  searchStories = function(query) {
    return this.api.stories.get({
      project_id: this.ticket.project_id,
      limit: 15,
      name: query
    })
    .$promise.then(function (response) {
      return response.data;
    });
  }.bind(this);

  updateDescription = function(data, successCallback, apiErrorCallback) {
    this.ticket.description = data.value;
    this.ticket.trustedDescription = this.textareaSanitizerService.sanitizeHTML(data.value);
    this.ticket.interactions = { data: data.mentions };

    this.convertStoriesToIds();

    this.api.ticket.ticket.put(this.ticket, onSaveSuccess, onSaveError);

    function onSaveSuccess() {
      // loadTicket();
      if (typeof successCallback != 'undefined') successCallback();
    }

    function onSaveError(response) {
      console.error(response);
      if (typeof apiErrorCallback != 'undefined') apiErrorCallback(response.data);
    }
  }.bind(this);

}
