(function ()
{
    'use strict';

    angular
        .module('CEP')
        .filter('no', no)
        .filter('n2br', n2br)
        .filter('firstLetterUpper', firstLetterUpper)
        .filter('numFormat', numFormat)
        .filter('stringToUrl', stringToUrl);

    function no() {
        return function (pagination, index) {
            return pagination.per_page * (pagination.current_page - 1) + index +1;
        };
    }

    function n2br() {
    	return function(text) {
    		if (text) {
		        return text.replace(/\n/g, '<br/>');
    		}

    		return;
	    };
    }

    function firstLetterUpper() {
        return function(text) {
            if (text.length) {
                return text[0].toUpperCase() + text.substr(0+1);
            }
            return '';
        };
    }

    function numFormat() {
        return function(number) {
            if (typeof number == 'undefined') {
                return ''
            }

            return number.toString().replace(/(\d)(?=(\d{3})+\.)/g, '$1 ');
        };
    }

    /**
     * Convert string into url, eg. 'Zapamiętywanie struktury katalogów' -> 'zapamietywanie-struktury-katalogow'
     *
     * @param $filter
     * @returns {string}
     */
    function stringToUrl() {
        return function (string, limit) {
            var str = string.substring(0, limit ? limit : 30); // limit string length
            str = str.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''); // remove special chars
            str = str.replace(/\s+/g, '-'); // replace spaces with '-'

            str = str.toLowerCase();

            // remove polish signs
            str = str.replace(/ą/g, 'a')
                .replace(/ć/g, 'c')
                .replace(/ę/g, 'e')
                .replace(/ł/g, 'l')
                .replace(/ń/g, 'n')
                .replace(/ó/g, 'o')
                .replace(/ś/g, 's')
                .replace(/ż/g, 'z')
                .replace(/ź/g, 'z');

            // remove deutsh signs
            str = str.replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss');

            return str;
        };
    }

})();
