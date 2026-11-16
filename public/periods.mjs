export function periodKeys(date,zone='Asia/Kolkata'){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const t=new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day));
  t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7);
  return {monthKey:`${parts.year}-${parts.month}`,weekKey:t.toISOString().slice(0,10)};
}
