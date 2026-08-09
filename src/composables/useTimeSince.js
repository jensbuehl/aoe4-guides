/**
 * A Date from whatever shape a stored timestamp arrived in.
 *
 * Firestore hands back a Timestamp with `.toDate()`, but the same field can also
 * be a plain `{ seconds }` map — a document written through a deep clone loses
 * the class and keeps only its data, and once stored that way it comes back that
 * way for good. Reading tolerantly is cheaper than repairing every document, and
 * the call sites should not each carry the knowledge.
 *
 * @param {Object|Date|number|null} value - A Timestamp, a map, a Date, or ms.
 * @return {Date|null} The moment, or null when there is not one.
 */
export function toDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  if (typeof value === "number") return new Date(value);
  return null;
}

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
          return Math.floor(elapsed / msPerDay) + " d";
        } else if (elapsed < msPerMonth) {
          return Math.floor(elapsed / msPerDay) + " d";
        } else if (elapsed < msPerMonth * 2) {
          return Math.floor(elapsed / msPerMonth) + " mo";
        } else if (elapsed < msPerYear) {
          return Math.floor(elapsed / msPerMonth) + " mo";
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
        if (elapsed < msPerDay * 2) {
          return true;
        }
        return false;
      };


    const formatCount = (n) => {
      if (!n || n < 1000) return String(n ?? 0);
      if (n < 10000) return (Math.round(n / 100) / 10).toFixed(1) + 'k';
      return Math.round(n / 1000) + 'k';
    };

    return { timeSince, isNew, formatCount }
  }