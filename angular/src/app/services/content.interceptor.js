(function () {
    'use strict';

    angular
        .module('app.core')
        .factory('contentInterceptor', contentInterceptor);

    /**
     * @description Handle images urls in data (rich text content).
     * Images are authenticated via token in url query param.
     * This is obviously a security risk and a bad practice, but that's how it's made here.
     * We remove tokens from payload and add tokens to response data.
    */
    function contentInterceptor($q, contentParserService) {
        var service = {
            request: request,
            response: response,
        };

        return service;


        // checks

        function isTicketRequest(config, method) {
            // projects/:project_id/tickets/:name  name example: IN-33 / 3213
            return config.method === method && (method === 'POST' ?
                !!config.url.match(/projects\/\d+\/tickets/) :
                !!config.url.match(/projects\/\d+\/tickets\/(\d+|\w+-\d+)(\?[\w\W]*)?$/));
        }

        function isKnowledgePageRequest(config, method) {
            // project/:project_id/pages/:id
            return config.method === method && (method === 'POST' ?
                !!config.url.match(/project\/\d+\/pages/) :
                !!config.url.match(/project\/\d+\/pages\/\d+/));
        }

        function isCommentsRequest(config, method) {
            // projects/:project_id/comments/:id
            return config.method === method && (method === 'POST' ?
                !!config.url.match(/projects\/\d+\/comments/) :
                !!config.url.match(/projects\/\d+\/comments\/\d+/));
        }

        // request

        function request(config) {
            if (isTicketRequest(config, 'POST') || isTicketRequest(config, 'PUT')) {
                parseTicketRequest(config);
            }

            if (isKnowledgePageRequest(config, 'POST') || isKnowledgePageRequest(config, 'PUT')) {
                parseKnowledgePageRequest(config);
            }

            if (isCommentsRequest(config, 'POST') || isCommentsRequest(config, 'PUT')) {
                parseCommentsRequest(config);
            }

            return config;
        }

        function parseTicketRequest(config) {
            config.data.description = contentParserService.removeTokens(config.data.description);
            if (config.data.comments) {
                config.data.comments.data.forEach(function(comment) { comment.text = contentParserService.removeTokens(comment.text) });
            }
        }

        function parseKnowledgePageRequest(config) {
            config.data.content = contentParserService.removeTokens(config.data.content);
            if (config.data.comments) {
                config.data.comments.data.forEach(function(comment) { comment.text = contentParserService.removeTokens(comment.text) });
            }
        }

        function parseCommentsRequest(config) {
            config.data.text = contentParserService.removeTokens(config.data.text);
        }

        // response

        function response(resp) {
            if (isTicketRequest(resp.config, 'GET')) {
                parseTicketResponse(resp.data);
            }

            if (isKnowledgePageRequest(resp.config, 'GET')) {
                parseKnowledgePageResponse(resp.data);
            }

            return resp || $q.when(resp);
        }

        function parseTicketResponse(data) {
            data.data.description = contentParserService.addTokens(data.data.description);
            data.data.comments.data.forEach(function(comment) { comment.text = contentParserService.addTokens(comment.text) });
        }

        function parseKnowledgePageResponse(data) {
            data.data.content = contentParserService.addTokens(data.data.content);
            data.data.comments.data.forEach(function(comment) { comment.text = contentParserService.addTokens(comment.text) });
        }

    }

})();
