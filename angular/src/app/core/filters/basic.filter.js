(function ()
{
    'use strict';

    angular
        .module('app.core')
        .filter('toTrusted', toTrustedFilter)
        .filter('htmlToPlaintext', htmlToPlainTextFilter)
        .filter('nospace', nospaceFilter)
        .filter('humanizeDoc', humanizeDocFilter)
        .filter('slice', slice)
        .filter('availability', availability);

    /** @ngInject */
    function toTrustedFilter($sce)
    {
        return function (value)
        {
            return $sce.trustAsHtml(value);
        };
    }

    /** @ngInject */
    function htmlToPlainTextFilter()
    {
        return function (text)
        {
            return String(text).replace(/<[^>]+>/gm, '');
        };
    }

    /** @ngInject */
    function nospaceFilter()
    {
        return function (value)
        {
            return (!value) ? '' : value.replace(/ /g, '');
        };
    }

    /** @ngInject */
    function humanizeDocFilter()
    {
        return function (doc)
        {
            if ( !doc )
            {
                return;
            }
            if ( doc.type === 'directive' )
            {
                return doc.name.replace(/([A-Z])/g, function ($1)
                {
                    return '-' + $1.toLowerCase();
                });
            }
            return doc.label || doc.name;
        };
    }

    /** @ngInject */
    function slice()
    {
        return function (arr, start, end)
        {
            return (arr || []).slice(start, end);
        };
    }

    /** @ngInject */
    function availability($filter)
    {
        return function (arr, date)
        {
            var date = $filter('date')(date, 'yyyy-MM-dd');

            return arr.filter(function(el) {
                return el.day == date;
            })
        };
    }

})();
