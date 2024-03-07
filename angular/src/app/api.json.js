(function() {
	'use strict';

	angular
		.module('CEP')
		.factory('apiJson', apiJson);

	/** @ngInject */
	function apiJson($resourceJson)
	{
		var baseUrl =  'app/data/';

		return {

	        quickPanel: {
	            activities: $resourceJson.getInstance(baseUrl + 'quick-panel/activities.json'),
	            contacts  : $resourceJson.getInstance(baseUrl + 'quick-panel/contacts.json'),
	            events    : $resourceJson.getInstance(baseUrl + 'quick-panel/events.json'),
	            notes     : $resourceJson.getInstance(baseUrl + 'quick-panel/notes.json')
	        },

	        mail: {
	            inbox: $resourceJson.getInstance(baseUrl + 'mail/inbox.json')
	        },

	        calendar: {
				users: $resourceJson.getInstance(baseUrl + 'calendar/users.json'),
				userWorkload: $resourceJson.getInstance(baseUrl + 'calendar/user-workload.json'),
	        },

	        auth: {
	            authenticate: $resourceJson.getInstance(baseUrl + 'auth/login.json')
	        },

			companyMyList: $resourceJson.getInstance(baseUrl + 'company/my-list.json'),
			numbering: $resourceJson.getInstance(baseUrl + 'numbering/index.json'),
			currentCompany: $resourceJson.getInstance(baseUrl + 'company/current.json'),

            payments: $resourceJson.getInstance(baseUrl + 'company/payments.json'),

			termNumber: $resourceJson.getInstance(baseUrl + 'numbering/current.json'),
			paymentsMethod: {
				current: $resourceJson.getInstance(baseUrl + 'payments-method/current.json'),
				list: $resourceJson.getInstance(baseUrl + 'payments-method/list.json'),
				deleteMethod: $resourceJson.getInstance(baseUrl + ''),
				setDefault: $resourceJson.getInstance(baseUrl + '', {}, {
					'put': {method: 'PUT'}
				}),
				update: $resourceJson.getInstance(baseUrl + '', {}, {
					'put': {method: 'PUT'}
				}),
				create: $resourceJson.getInstance(baseUrl + ''),
			},

			users: $resourceJson.getInstance(baseUrl + 'users/list.json'),
			contractor: $resourceJson.getInstance(baseUrl + 'contractors/get.json'),
			contractors: $resourceJson.getInstance(baseUrl + 'contractors/list.json'),
			products: $resourceJson.getInstance(baseUrl + 'products/list.json'),
			product: $resourceJson.getInstance(baseUrl + 'products/get.json'),
			taxs: $resourceJson.getInstance(baseUrl + 'products/taxs.json'),
			cashOperations: $resourceJson.getInstance(baseUrl + 'cash-operations/list.json'),
			receipts: $resourceJson.getInstance(baseUrl + 'receipts/list.json'),
			onlineSales: $resourceJson.getInstance(baseUrl + 'online-sales/list.json'),

			projectUsers: $resourceJson.getInstance(baseUrl + 'projects/show.json'),
			files: $resourceJson.getInstance(baseUrl + 'files/files.json'),

		}
	}

})();