(function (window) {
    
    window.__env = window.__env || {};

    // API url
    window.__env.apiUrl = 'https://api.agileboard.me/';

    // socket.io url
    window.__env.wsUrl = 'http://localhost:4000';

    //home url
    window.__env.homeUrl = 'https://app.agileboard.me/';

    //title
    window.__env.title = 'CEP';
    window.__env.title_landingpage_pl = 'Agile board - Proste narzędzie do organizacji spraw';
    window.__env.title_landingpage_en = 'Agile board - Simply supports Your management';


    //logo
    //directory with logo in assets/logos or empty (def)
    window.__env.logo = 'cep';
    
    //copyright (footer)
    window.__env.copyright = 'cep.devpark.pl';

    //is fv portal
    window.__env.is_fv = false;

    //table limit rows
    window.__env.table_limit_rows = 15;

    // default language
    window.__env.default_language = 'en';

    //auto create company from user-email address if not invited
    //only for AB
    window.__env.create_company_from_email = true;
    
    //redirect to projects page after creating new company
    //if no projects present goes to create one
    //only for AB
    window.__env.new_company_to_new_project_redirection = true;

    //google analytics (false or id)
    window.__env.ga = false;

    //smartlook (false or id)
    window.__env.smartlook = false;

    // Whether or not to enable debug mode
    // Setting this to false will disable console output
    window.__env.enableDebug = true;

}(this));
