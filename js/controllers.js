'use strict';

/* Controllers */
angular.module('pluffApp.controllers', [])
  .controller('LanguageCtrl', LanguageCtrl)
  .controller('TimeTableCtrl', TimeTableCtrl)
  .controller('HolidaysCtrl', HolidaysCtrl)
  .controller('RoomsCtrl', RoomsCtrl);

function LanguageCtrl($scope, $translate, $route) {
  $scope.switch = function($lang) {
    // Switch to the given language
    $translate.use($lang);
    // Full page reload to apply all languages
    window.location.reload();
  }
}

function TimeTableCtrl($scope, $http, hourService, $window, $location, dataService, timetableData, ngDialog) {
  $scope.days = [
    {number: 1, spelled: 'MONDAY'},
    {number: 2, spelled: 'TUESDAY'},
    {number: 3, spelled: 'WEDNESDAY'},
    {number: 4, spelled: 'THURSDAY'},
    {number: 5, spelled: 'FRIDAY'}
  ];

  // TODO: start times probably aren't necessary (?)
  $scope.hours = [
    {number: 1, start: '08:45'},
    {number: 2, start: '09:35'},
    {number: 3, start: '10:45'},
    {number: 4, start: '11:35'},
    {number: 5, start: '12:25'},
    {number: 6, start: '13:15'},
    {number: 7, start: '14:05'},
    {number: 8, start: '15:15'},
    {number: 9, start: '16:05'},
    {number: 10, start: '16:55'},
    {number: 11, start: '18:00'},
    {number: 12, start: '18:50'},
    {number: 13, start: '20:00'},
    {number: 14, start: '21:40'}
  ];

  // Get the personal schedule from the API
  $scope.tableData = timetableData.data;
  $scope.tableTitle = timetableData.title;

  // Set the default used weeknumber (without leading zero). In the weekend, use the next week number
  $scope.weekNumberUsed = parseInt((moment().day() > 5) ? moment().add(1, 'w').format('w') : moment().format('w'));

  $scope.weekNumber = function() {
    var weekInfo = {};

    // Get current week number (without leading zero)
    var currentTime = moment();

    // Set default weeknumber. In the weekend, use the next week number
    weekInfo.current = parseInt((currentTime.day() > 5) ? currentTime.add(1, 'w').format('w') : currentTime.format('w'));
    weekInfo.use = $scope.weekNumberUsed;

    // Rotate the number when the year has ended
    if (weekInfo.use === 53) {
      weekInfo.use = 1;
    }
    if (weekInfo.use === 0) {
      weekInfo.use = 52;
    }

    $scope.weekNumberUsed = weekInfo.use;

    return weekInfo;
  };

  $scope.nextWeek = function() {
    // Add 1 to the weeknumber in use
    $scope.weekNumberUsed++;
    console.log('Op naar volgende week! ' + $scope.weekNumberUsed);
  };

  $scope.currentWeek = function() {
    // Reset to the current week
    $scope.weekNumberUsed = $scope.weekNumber().current;
    console.log('Op naar de huidige week! ' + $scope.weekNumberUsed);
  };

  $scope.previousWeek = function() {
    // Subtract 1 from the weeknumber in use
    $scope.weekNumberUsed--;
    console.log('Op naar de vorige week! ' + $scope.weekNumberUsed);
  };

  $scope.getHour = function(dayNumber, hourNumber) {
    return hourService.getHour($scope, dayNumber, hourNumber);
  };

  // Bind keybindings to the window to enable right and left arrow navigation
  angular.element($window).on('keydown', function(e) {
    // Go to the next week on right arrow key
    if (e.keyCode === 39) {
      $scope.$apply(function() {
        $scope.nextWeek();
      });
    }
    // Go to the previous week on left arrow key
    if (e.keyCode === 37) {
      $scope.$apply(function() {
        $scope.previousWeek();
      });
    }
  });

  // Calculate the date of the current day
  $scope.currentDayDate = function(dayNumber) {
    // TODO: Don't hardcode the year!
    return moment('2014-' + $scope.weekNumber().use + '-' + dayNumber, 'YYYY-w-d');
  }

  // Check if the current day is today
  $scope.isActiveDay = function(dayNumber) {
    if (moment().isSame($scope.currentDayDate(dayNumber), 'day')) {
      return true;
    }
  };

  // Check if the used week is older then or the same as the current week
  $scope.isOldWeek = function() {
    if ($scope.weekNumberUsed <= $scope.weekNumber().current) {
      return true;
    }
    return false;
  };

  // Display the start and end time of a lesson
  $scope.lessonStartEndTime = function(start, end) {
    var startTime = moment(start);
    var endTime = moment(end);

    return startTime.format('H:m') + ' - ' + endTime.format('H:m');
  };

  dataService.getSuggestions().then(function(payload) {
    // Add the resulting array in the global scope for the autocomplete plugin to use it
    $scope.searchAuto = payload.data;
  });

  // Fired when a search suggestion is selected
  $scope.searchSelected = function(selected) {
    var title = selected.originalObject.name;
    var category = selected.originalObject.category;

    // Check which category is selected (room or class) to update the url
    console.log('Autocomplete ' + category + ' ' + title);
    $location.path('/' + category + '/' + title);
  };

  $scope.teacherDialog = function(teacherAbr) {
    // When the API data is loaded, open the dialog
    dataService.getTeacher(teacherAbr).then(function(payload) {
      var data = payload.data;

      ngDialog.open({
        template: 'partials/dialog-teacher.html',
        data: data
      });
    });
  }
}

// Holidays dialog
function HolidaysCtrl($scope, holidayService) {
  // Load the holiday JSON and insert it in the scope
  holidayService.getHolidays().then(function(payload) {
    $scope.holidays = payload;
  });

}

// Holidays dialog
function RoomsCtrl($scope, roomService) {
  // Load the free rooms!
  roomService.getFreeRooms().then(function(payload) {
    $scope.rooms = payload;
  });

}
