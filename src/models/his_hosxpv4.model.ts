import Knex = require('knex');
export class HisHosxpv4Model {

  getHospital(db: Knex, hn: any) {
    return db('opdconfig as o')
      .select('o.hospitalcode as hcode', 'o.hospitalname as hname')
  }

  getServices(db: Knex, hn, dateServe) {
    return db('ovst as v')
      .select(db.raw(`v.vstdate as date_serv, v.vsttime as time_serv, k.department as clinic,
          v.vn as seq, v.vn`))
      .innerJoin('kskdepartment as k', 'k.depcode', 'v.main_dep')
      .where('v.hn', hn)
      .where('v.vstdate', dateServe)
  }

  getSeq(db: Knex, dateServe: any, hn: any) {
    return db('ovst as o')
      .select('o.vn as seq', 'o.vn as visitno', 'o.vstdate as date', 'o.vsttime as time', 'k.department')
      .leftOuterJoin('kskdepartment as k', 'k.depcode', 'o.main_dep')
      .whereRaw(`DATE(o.vstdate) = ${dateServe} and o.hn = ${hn}`);
  }

  getProfile(db: Knex, hn: any) {
    return db('patient')
      .select('pname as title_name', 'fname as first_name', 'lname as last_name')
      .where('hn', hn);
  }

  getAllergyDetail(db: Knex, hn: any) {
    return db('opd_allergy')
      .select('agent as drug_name', 'symptom')
      .where('hn', hn);
  }

  getChronic(db: Knex, hn: any) {
    return db('person_chronic as pc')
      .select('pc.regdate as start_date', 'pc.icd10 as icd10_code', 'i.name as icd_name')
      .leftOuterJoin('person as pe', 'pe.person_id', '=', 'pc.person_id')
      .leftOuterJoin('patient as pa', 'pa.cid', '=', 'pe.cid')
      .leftOuterJoin('icd101 as i', 'i.code', '=', 'pc.icd10')
      .where('pa.hn', hn);
  }

  getDiagnosis(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('ovstdiag as o')
      .select('o.vn', 'o.vstdate as date_serv',
        'o.vsttime as time_serv', 'o.icd10 as icd10_code', 'i.name as icd10_desc', 't.name as diag_type')
      .leftOuterJoin('icd101 as i', 'i.code', '=', 'o.icd10')
      .leftOuterJoin('diagtype as t', 't.diagtype', 'o.diagtype')
      .where('vn', vn);
  }

  async getProcedure(db: Knex, hn: any, dateServe: any, vn: any) {
    let data = await db.raw(`SELECT d.er_oper_code as procedure_code,e.name as procedure_name,date(d.begin_date_time) as start_date, 
    time(d.begin_date_time) as start_time,
    date(d.end_date_time) as end_date,TIME(d.end_date_time) as end_time
    FROM doctor_operation as d
    LEFT OUTER JOIN ovst o on o.vn=d.vn
    LEFT OUTER JOIN er_oper_code as e on e.er_oper_code=d.er_oper_code
    WHERE o.hn = ?
    UNION
    SELECT e.er_oper_code as procedure_code,c.name as procedure_name,o.vstdate as start_date, 
    time(e.begin_time) as start_time,o.vstdate as end_date,TIME(e.end_time) as end_date
    FROM er_regist_oper as e
    LEFT OUTER JOIN ovst o on o.vn=e.vn
    LEFT OUTER JOIN er_oper_code as c on c.er_oper_code=e.er_oper_code
    WHERE o.hn = ?
    `, [vn, vn, vn, vn]);
    return data[0];
  }

  getRefer(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('referout as r')
      .select('o.vn as seq', 'o.vstdate as date_serv',
        'o.vsttime as time_serv', 'r.refer_hospcode as to_provider_code', 'h.name as to_provider_name',
        'c.name as refer_cause')
      .innerJoin('refer_cause as c', 'c.id', 'r.refer_cause')
      .innerJoin('ovst as o ', 'o.vn', 'r.vn')
      .innerJoin('hospcode as h', 'h.hospcode', 'r.refer_hospcode')
      .where('r.vn', vn);
  }

  getDrugs(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('opitemrece as o')
      .select('o.vn', 'o.vstdate as date_serv', 'o.vsttime as time_serv',
        'o.icode as drugcode', 's.name as drug_name', 'o.qty', 's.units as unit',
        'u.name1 as usage_line1', 'u.name2 as usage_line2', 'u.name3 as usage_line3', )
      .innerJoin('s_drugitems as s', 's.icode', 'o.icode')
      .innerJoin('drugusage as u', 'u.drugusage', 'o.drugusage')
      .where('o.vn', vn)
  }

  getLabs(db: Knex, hn: any, dateServe: any, vn: any) {
    return db('lab_order as l')
      .select('o.vstdate as date_serv', 'o.vsttime as time_serv',
        'o.vn', 'l.lab_items_name_ref as lab_name', 'l.lab_order_result as lab_result',
        'l.lab_items_normal_value_ref as standard_resul')
      .innerJoin('lab_head as h', 'h.lab_order_number', 'l.lab_order_number')
      .innerJoin('ovst as o', 'o.vn', 'h.vn')
      .where('h.vn', vn)
  }

  getVaccine(db: Knex, vn: any) {
    return db('person_vaccine_list as l')
      .select(db.raw(`o.vstdate as date_serv,o.vsttime as time_serv,v.vaccine_code,v.vaccine_name`))
      .innerJoin('person as p', 'p.person_id', 'l.person_id')
      .innerJoin('patient as e', 'e.cid', 'p.cid')
      .innerJoin('ovst as o', 'o.hn', 'e.hn')
      .innerJoin('person_vaccine as v', 'v.person_vaccine_id', 'l.person_vaccine_id')
      .where('o.vn', vn)
      .union(function () {
        this.select(db.raw(`o.vstdate as date_serv,o.vsttime as time_serv,v.vaccine_code,v.vaccine_name`))
          .innerJoin('ovst as o', 'o.vn', 'l.vn')
          .innerJoin('person_vaccine as v', 'v.person_vaccine_id', 'l.person_vaccine_id')
          .from('ovst_vaccine as l')
          .where('o.vn', vn);
      })
  }

  getAppointment(db: Knex, hn: any, dateServ: any, vn: any) {
    return db('oapp as o')
      .select('o.vn', 'v.vstdate as date_serv', 'v.vsttime as time_serv',
        'c.name as department', 'o.nextdate as date', 'o.nexttime as time', 'o.app_cause as detail')
      .innerJoin('ovst as v', 'v.vn', 'o.vn')
      .innerJoin('clinic as c', 'c.clinic', 'o.clinic')
      .where('o.vn', vn);
  }

}