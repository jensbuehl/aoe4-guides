export default function useTimeSince() {

    const timeSince = (date) => {
        var msPerMinute = 60 * 1000;
        var msPerHour = msPerMinute * 60;
        var msPerDay = msPerHour * 24;
        var msPerMonth = msPerDay * 30;
        var msPerYear = msPerDay * 365;
      
        var now = new Date();
        var elapsed = now - date;
      
        if (elapsed < msPerDay) {
          return "today";
        } else if (elapsed < msPerDay * 2) {
          return Math.floor(elapsed / msPerDay) + " day";
        } else if (elapsed < msPerMonth) {
          return Math.floor(elapsed / msPerDay) + " days";
        } else if (elapsed < msPerMonth * 2) {
          return Math.floor(elapsed / msPerMonth) + " month";
        } else if (elapsed < msPerYear) {
          return Math.floor(elapsed / msPerMonth) + " months";
        } else {
          var month = date
            .toDateString()
            .match(/ [a-zA-Z]*/)[0]
            .replace(" ", "");
          var year =
            date.getFullYear() == now.getFullYear() ? "" : " " + date.getFullYear();
          return month + year;
        }
      };
      
      const isNew = (date) => {
        var msPerMinute = 60 * 1000;
        var msPerHour = msPerMinute * 60;
        var msPerDay = msPerHour * 24;
      
        var now = new Date();
        var elapsed = now - date;
      
        //New when created within the past 7 days
        if (elapsed < msPerDay * 7) {
          return true;
        }
        return false;
      };


    return { timeSince, isNew }
  }