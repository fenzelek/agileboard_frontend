angular
    .module("CEP")
    .run(runBlock);


    /** @ngInject */
    function runBlock($templateCache)
    {
        function requireAll(requireContext) {
            return requireContext.keys().map(function(val) {
              return {
                tpl: requireContext(val),
                name: val.split('/').pop(),
              };
            });
          }
        
        let modules = requireAll(require.context('../', true, /\.html$/));
    
        modules.map(function(val) {
            $templateCache.put(val.name, val.tpl);
        });

    }