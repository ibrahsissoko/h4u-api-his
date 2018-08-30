import Knex = require('knex');
import * as moment from 'moment';
const dbName = process.env.HIS_DB_NAME;
const hospcode = process.env.HIS_CODE;

export class HisHomcModel {

  getHospital(db: Knex, hn: any) {
    let sql = `SELECT OFF_ID as provider_code,NAME as provider_name from HOSPCODE where OFF_ID = ?`;
    return db.raw(sql, [hospcode]);
  }
  getProfile(db: Knex, hn: any) {
    return db('PATIENT')
      .select('titleCode as title_name', 'firstName as first_name', 'lastName as last_name')
      .where('hn', hn)
  }

  getServices(db: Knex, dateServ: any, hn: any) {
    let sql = `SELECT o.hn + o.regNo as seq,
    convert(date,convert(char,o.registDate -5430000)) as date_serv,
    CONVERT (time,(left (o.timePt,2)+':'+right (o.timePt,2))) as time_serv,
    d.deptDesc as department
    from OPD_H as o
    left join DEPT d on(d.deptCode = o.dept)
    where convert(date,convert(char,o.registDate -5430000)) = ? and o.hn = ?
    `;
    const result = db.raw(sql, [dateServ, hn]);
    return result[0];
  }

  getAllergyDetail(db: Knex, hn: any) {
    return db('opd_allergy')
      .select('agent as drug_name', 'symptom as symptom_desc')
      .where('hn', hn);
  }

  getChronic(db: Knex, hn: any) {
    return db('person_chronic as pc')
      .select('pc.icd10 as icd10_code', 'i.name as icd10_desc')
      .leftOuterJoin('patient as pa', 'pa.hn', '=', 'pc.hn')
      .leftOuterJoin('person as pe', 'pe.cid', '=', 'pa.cid')
      .leftOuterJoin('icd101 as i', 'i.code', '=', 'pc.icd10')
      .where('pa.hn', hn);
  }

  getDiagnosis(db: Knex, hn: any, date_serv: any) {
    let data = db.raw(`select o.hn + p.regNo as seq,
    convert(date,convert(char,p.VisitDate -5430000)) as date_serv, 
    o.timePt as time_serv,p.ICDCode as icd_code,ic.DES as icd_name,p.DiagType as diag_type
    from PATDIAG p
    left join OPD_H o on(o.hn = p.Hn and o.regNo = p.regNo) 
    left join ICD101 ic on(ic.CODE = p.ICDCode)
    where p.DiagType in('I','E') and p.pt_status in('O','Z')
    and o.hn = ? and convert(date,convert(char,p.VisitDate -5430000)) = ?
    `,
      [date_serv, hn]);
    return data[0];
    // return db('ovstdiag as o')
    //   .select('o.icd10 as icd10_code', 'i.name as icd10_desc', 'o.diagtype as diage_type')
    //   .leftOuterJoin('icd101 as i', 'i.code', '=', 'o.icd10')
    //   .where('vn', vn);
  }

  getRefer(db: Knex, hn: any, dateServe: any, vn: any) {
    let sql = `SELECT r.refer_hospcode, c.name as refer_cause
    FROM referout r 
    LEFT OUTER JOIN refer_cause c on c.id = r.refer_cause
    WHERE r.vn = ? `;
    //return db.raw(sql, [vn]);
    const result = db.raw(sql, [vn]);
    return result[0];

    // return db('referout as r')
    //     .select('o.rfrlct as hcode_to', 'h.namehosp as name_to', 'f.namerfrcs as reason')
    //     .leftJoin('hospcode as h', 'h.off_id', '=', 'o.rfrlct')
    //     .leftJoin('rfrcs as f', 'f.rfrcs', '=', 'o.rfrcs')
    //     .where('vn', vn);
  }

  getDrugs(db: Knex, hn: any, date_serv: any) {
    let sql = `select p.hn + p.registNo2 as seq,
    convert(date,convert(char,p.registDate -5430000)) as date_serv,
    convert(char(5), p.firstIssTime, 108) as time_serv,m.name as drug_name,
    p.qty as qty,p.unit as unit,p.lamedTimeText as usage_line1,p.lamedText as usage_line2, ' ' as usage_line3 
    from Patmed p
    left join Med_inv m on (m.code = p.invCode)
    left join Deptq_d d on (d.hn = p.hn and d.regNo = p.registNo)
    left join OPD_H h on( p.hn = h.hn and p.registNo2 = h.regNo) 
    where p.hn = ? and convert(date,convert(char,p.registDate -5430000)) = ?    
    `;
    const result = db.raw(sql, [hn, date_serv]);
    return result[0];
  }

  getLabs(db: Knex, hn: any, dateServe: any, vn: any) {
    let sql = `select l.hn + l.reg_flag as seq,
    convert(date,convert(char,l.res_date -5430000)) as date_serv,
    l.res_time as time_serv,l.result_name as lab_name,
    l.real_res as lab_result,l.resNormal as standard_result 
    from Labres_d l where l.hn = ?
    and convert(date,convert(char,l.res_date -5430000)) = ? 
    `;
    const result = db.raw(sql, [hn, dateServe]);
    return result[0];
  }

  //   getAnc(db: Knex, vn: any) {
  //     let sql = `SELECT a.preg_no as ga, a.current_preg_age as anc_no, s.service_result as result
  // from person_anc a  
  // left outer join person p on p.person_id = a.person_id
  // LEFT OUTER JOIN patient e on e.cid=p.cid
  // LEFT OUTER JOIN ovst o on o.hn = e.hn
  // left outer join person_anc_service s on s.person_anc_id=a.person_anc_id
  // where (a.discharge <> 'Y' or a.discharge IS NULL) 
  // and o.vn = ? `;
  //     return db.raw(sql, [vn]);
  //   }

  getVacine(db: Knex, hn: any) {
    let sql = `select convert(date,convert(char,o.registDate -5430000)) as date_serv,
    CONVERT (time,(left (o.timePt,2)+':'+right (o.timePt,2))) as time_serv,
    p.VACCODE as vaccine_code,v.VACNAME as vaccine_name 
    from PPOP_EPI p
    left join OPD_H o on(o.hn = p.HN and p.REGNO = o.regNo)
    left join PPOP_VACCINE v on(v.VACCODE = p.VACCODE)
    where o.hn = ?
    `;
    const result = db.raw(sql, [hn, hn]);
    return result[0];
  }

  getAppointment(db: Knex, hn: any, date_serv: any) {
    let sql = `select p.hn + p.regNo as seq,a.pre_dept_code as clinic,
    convert(date,convert(char,p.registDate -5430000)) as date_serv,p.timePt as time_serv,
    convert(date,convert(char,a.appoint_date -5430000)) as appoint_date,
    a.appoint_time_from as appoint_time,a.appoint_note as detail 
    from Appoint a
    left join OPD_H p on( a.hn = p.hn and a.regNo = p.regNo) 
    where p.hn = ? and convert(date,convert(char,p.registDate -5430000)) = ?
    `;
    const result = db.raw(sql, [hn, date_serv]);
    return result[0];
  }
}