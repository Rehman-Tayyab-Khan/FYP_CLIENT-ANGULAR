import { Sequelize } from "sequelize";
import { User } from "./user.model";
import { Patient } from "./patient.model";
import { PatientCase } from "./patientCase.model";
import { DoctorProfile } from "./doctorProfile.model";
import { Permission } from "./permission.model";
import { UserPermission } from "./userPermission.model";
import { Appointment } from "./appointment.model";
import { Visit } from "./visit.model";
import { Firm } from "./firm.model";
import { Insurance } from "./insurance.model";
import { InsuranceAddress } from "./insuranceAddress.model";
import { PracticeLocation } from "./practiceLocation.model";
import { Specialty } from "./specialty.model";
import { Diagnoses } from "./diagnoses.model";

const models = {
  User,
  Patient,
  PatientCase,
  DoctorProfile,
  Permission,
  UserPermission,
  Appointment,
  Visit,
  Firm,
  Insurance,
  InsuranceAddress,
  PracticeLocation,
  Specialty,
  Diagnoses,
};

//INFO: Initializing every model's schema definition against the provided Sequelize instance
export function initModels(sequelize: Sequelize): typeof models {
  User.initModel(sequelize);
  Permission.initModel(sequelize);
  Specialty.initModel(sequelize);
  PracticeLocation.initModel(sequelize);
  Firm.initModel(sequelize);
  Insurance.initModel(sequelize);
  InsuranceAddress.initModel(sequelize);
  Diagnoses.initModel(sequelize);
  Patient.initModel(sequelize);
  DoctorProfile.initModel(sequelize);
  UserPermission.initModel(sequelize);
  PatientCase.initModel(sequelize);
  Appointment.initModel(sequelize);
  Visit.initModel(sequelize);

  //INFO: Registering all belongsTo/hasMany/hasOne relationships after every model is initialized
  Object.values(models).forEach((model: any) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
  });

  return models;
}

export {
  User,
  Patient,
  PatientCase,
  DoctorProfile,
  Permission,
  UserPermission,
  Appointment,
  Visit,
  Firm,
  Insurance,
  InsuranceAddress,
  PracticeLocation,
  Specialty,
  Diagnoses,
};

export default models;
