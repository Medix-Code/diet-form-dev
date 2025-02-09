/**
 * Classe "Diet" per encapsular totes les dades d'una dieta
 */

export class Diet {
  constructor({
    id = "",
    date = "",
    dietType = "",
    vehicleNumber = "",
    person1 = "",
    person2 = "",
    signatureConductor = "",
    signatureAjudant = "",
    services = [],
    timeStampDiet = new Date().toISOString(),
  }) {
    this.id = id;
    this.date = date;
    this.dietType = dietType;
    this.vehicleNumber = vehicleNumber;
    this.person1 = person1;
    this.person2 = person2;
    this.signatureConductor = signatureConductor;
    this.signatureAjudant = signatureAjudant;
    this.services = services;
    this.timeStampDiet = timeStampDiet;
  }
}
