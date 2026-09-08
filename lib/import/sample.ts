import { addDays, parisDate } from "../time";

function appleStamp(isoDate: string, hms: string, offset = "+0200"): string {
  return `${isoDate} ${hms} ${offset}`;
}

/** Deterministic Apple Health XML for tests and "Importer l'exemple". */
export function buildSampleHealthXml(anchorDate = parisDate()): string {
  const day = anchorDate;
  const prev = addDays(day, -1);
  return `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="fr_FR">
  <ExportDate value="${appleStamp(day, "08:00:00")}"/>
  <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="34.2" durationUnit="min" totalDistance="6.4" totalDistanceUnit="km" totalEnergyBurned="410" totalEnergyBurnedUnit="kcal" sourceName="Apple Watch" sourceVersion="11.0" creationDate="${appleStamp(day, "07:40:00")}" startDate="${appleStamp(day, "07:02:00")}" endDate="${appleStamp(day, "07:36:12")}"/>
  <Workout workoutActivityType="HKWorkoutActivityTypeWalking" duration="18" durationUnit="min" totalDistance="1.4" totalDistanceUnit="km" sourceName="iPhone" creationDate="${appleStamp(prev, "18:30:00")}" startDate="${appleStamp(prev, "18:10:00")}" endDate="${appleStamp(prev, "18:28:00")}"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepCore" startDate="${appleStamp(prev, "23:12:00")}" endDate="${appleStamp(day, "01:40:00")}"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepDeep" startDate="${appleStamp(day, "01:40:00")}" endDate="${appleStamp(day, "03:05:00")}"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepREM" startDate="${appleStamp(day, "03:05:00")}" endDate="${appleStamp(day, "04:20:00")}"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAsleepCore" startDate="${appleStamp(day, "04:20:00")}" endDate="${appleStamp(day, "05:36:00")}"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisInBed" startDate="${appleStamp(prev, "23:00:00")}" endDate="${appleStamp(day, "05:45:00")}"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" value="HKCategoryValueSleepAnalysisAwake" startDate="${appleStamp(day, "05:36:00")}" endDate="${appleStamp(day, "05:45:00")}"/>
</HealthData>
`;
}
