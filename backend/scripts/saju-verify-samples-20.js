/**
 * 참조 사이트(https://beta-ybz6.onrender.com/) 검증용 20건 샘플 입력
 * 형식: { id, description, input: { birthDate, birthTime, calendarType, isIntercalation, gender } }
 */
export const VERIFY_SAMPLES_20 = [
  {
    id: 'sample-01',
    description: '양력 2017-06-24 무시 무성별 (README)',
    input: { birthDate: '2017-06-24', birthTime: null, calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-02',
    description: '음력 1956-01-21 여 (README)',
    input: { birthDate: '1956-01-21', birthTime: null, calendarType: 'lunar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-03',
    description: '양력 1990-05-15 14:30 남',
    input: { birthDate: '1990-05-15', birthTime: '14:30', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-04',
    description: '양력 2000-01-01 09:00 여',
    input: { birthDate: '2000-01-01', birthTime: '09:00', calendarType: 'solar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-05',
    description: '양력 1988-02-17 08:00 남',
    input: { birthDate: '1988-02-17', birthTime: '08:00', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-06',
    description: '음력 1985-08-15 20:00 남 (추석)',
    input: { birthDate: '1985-08-15', birthTime: '20:00', calendarType: 'lunar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-07',
    description: '양력 1995-07-20 12:00 여',
    input: { birthDate: '1995-07-20', birthTime: '12:00', calendarType: 'solar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-08',
    description: '양력 1970-01-01 00:00 남 (자정)',
    input: { birthDate: '1970-01-01', birthTime: '00:00', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-09',
    description: '양력 1984-11-16 01:00 남 (월운 검증용)',
    input: { birthDate: '1984-11-16', birthTime: '01:00', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-10',
    description: '양력 1960-03-15 06:00 여',
    input: { birthDate: '1960-03-15', birthTime: '06:00', calendarType: 'solar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-11',
    description: '양력 2005-12-31 23:00 남 (연말)',
    input: { birthDate: '2005-12-31', birthTime: '23:00', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-12',
    description: '음력 1992-02-01 10:30 여',
    input: { birthDate: '1992-02-01', birthTime: '10:30', calendarType: 'lunar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-13',
    description: '양력 1975-08-08 15:45 남',
    input: { birthDate: '1975-08-08', birthTime: '15:45', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-14',
    description: '양력 2010-04-04 07:00 여 (입춘 근처)',
    input: { birthDate: '2010-04-04', birthTime: '07:00', calendarType: 'solar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-15',
    description: '음력 1980-05-05 14:00 남',
    input: { birthDate: '1980-05-05', birthTime: '14:00', calendarType: 'lunar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-16',
    description: '양력 1955-10-10 11:00 여',
    input: { birthDate: '1955-10-10', birthTime: '11:00', calendarType: 'solar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-17',
    description: '양력 1998-01-15 무시 남',
    input: { birthDate: '1998-01-15', birthTime: null, calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-18',
    description: '음력 1972-07-07 03:30 여',
    input: { birthDate: '1972-07-07', birthTime: '03:30', calendarType: 'lunar', isIntercalation: false, gender: 'F' },
  },
  {
    id: 'sample-19',
    description: '양력 2002-06-20 18:00 남',
    input: { birthDate: '2002-06-20', birthTime: '18:00', calendarType: 'solar', isIntercalation: false, gender: 'M' },
  },
  {
    id: 'sample-20',
    description: '음력 2017-05-01 09:00 여 (윤달 아님)',
    input: { birthDate: '2017-05-01', birthTime: '09:00', calendarType: 'lunar', isIntercalation: false, gender: 'F' },
  },
];
