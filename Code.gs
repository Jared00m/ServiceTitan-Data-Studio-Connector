var cc = DataStudioApp.createCommunityConnector();

function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.KEY)
    .build();
}

function getConfig(request) {
  var config = cc.getConfig();

  config.newInfo()
    .setId('instructions')
    .setText('Enter the API key provided by ServiceTitan.');

  config.newTextInput()
    .setId('key')
    .setName('API Key');
  
  config.setDateRangeRequired(false);

  return config.build();
}

function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields.newDimension()
    .setId('CreatedOn')
    .setType(types.YEAR_MONTH_DAY);

  fields.newDimension()
    .setId('CustomerName')
    .setType(types.TEXT);
  
  return fields;
  
}

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema : field };
}

function responseToRows(requestedFields, response) {
  // Transform parsed data and filter for requested fields
  return response.map(function(dailyDownload) {
    var row = [];
    requestedFields.asArray().forEach(function (field) {
      switch (field.getId()) {
        case 'createdOn':
          return row.push(dailyDownload.CreatedOn);
        case 'customer.name':
          return row.push(dailyDownload.CustomerName);
        default:
          return row.push('');
      }
    });
    return { values: row };
  });
}

function getData(request) {
  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);

  // Fetch and parse data from API
  var url = [
    'https://api.servicetitan.com/v1/jobs?serviceTitanApiKey=',
    request.configParams.key,
    '&OrderBy=CreatedOn&OrderByDirection=Desc'
  ];
  var response = UrlFetchApp.fetch(url.join(''));
  var parsedResponse = JSON.parse(response).downloads;
  var rows = responseToRows(requestedFields, parsedResponse);

  return {
    schema: requestedFields.build(),
    rows: rows
  };
}



