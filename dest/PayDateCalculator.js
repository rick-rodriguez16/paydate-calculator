"use strict";
/* This method determines the first available due date follwing the funding of a loan. */
class PayDateCalculator {
    constructor() {
        this.payDateAfterFundDate = new Date(); // The clients unadjusted paydate (post fund date) based on their pay date 
        //   model(payDay and paySpan) and will set the initial due date. It will be
        //   use to assign the due date to an advanced pay date to meet all requirements.
        this.loopType = 'forward';
        this.oneDayInMilliSec = 24 * 60 * 60 * 1000;
        this.dueDate = new Date();
    }
    calculateDueDate(fundDay, holidays, paySpan, payDay, hasDirectDeposit) {
        this.setInitialDueDate(fundDay, paySpan, payDay);
        this.processDueDate(fundDay, holidays, paySpan, hasDirectDeposit);
        return this.dueDate;
    }
    //helper functions
    // Set the initial due date to the first pay date after the fund day and before other
    // factors are processed (direct deposit, holidays, weekends, 10 days after fund date, etc.)
    setInitialDueDate(fundDay, paySpan, payDay) {
        this.dueDate.setTime(this.firstPayDateAfterFundDate(fundDay, paySpan, payDay));
    }
    firstPayDateAfterFundDate(fundDay, paySpan, payDay) {
        this.payDateAfterFundDate.setTime(payDay.getTime());
        // if the pay date provided is before the fundDay, continue to add the paySpan until
        // the first pay date after the fundDay is reached.
        while (this.payDateAfterFundDate.getTime() < fundDay.getTime()) {
            this.payDateAfterFundDate.setTime(this.payDateAfterFundDate.getTime() + this.payDateModel(paySpan));
        }
        return this.payDateAfterFundDate.getTime();
    }
    payDateModel(paySpan) {
        let isPaySpan = paySpan.toLowerCase();
        let monthInMillisec = 30 * this.oneDayInMilliSec;
        let biweekInMillisec = 14 * this.oneDayInMilliSec;
        let weekInMillisec = 7 * this.oneDayInMilliSec;
        if (isPaySpan === 'monthly') {
            return monthInMillisec;
        }
        if (isPaySpan === 'bi-weekly') {
            return biweekInMillisec;
        }
        // default is weekly
        return weekInMillisec;
    }
    // Now, adjust the due date based on direct deposit, holidays, 
    //  weekends, and if it is 10 days or more beyond the fundDay.
    processDueDate(fundDay, holidays, paySpan, hasDirectDeposit) {
        do {
            this.checkForDirectDeposit(hasDirectDeposit);
            this.checkForHolidaysAndWeekend(holidays);
        } while (!this.isDueDateTenDaysAfterFundDate(fundDay, paySpan));
    }
    isDueDateTenDaysAfterFundDate(fundDay, paySpan) {
        let fundDatePlusTenDays = new Date(fundDay.getTime() + 10 * this.oneDayInMilliSec);
        if (this.dueDate.getTime() < fundDatePlusTenDays.getTime()) {
            // set due date to the next forward pay date
            this.payDateAfterFundDate.setTime(this.payDateAfterFundDate.getTime() + this.payDateModel(paySpan));
            this.dueDate.setTime(this.payDateAfterFundDate.getTime());
            this.loopType = 'forward';
            return false;
        }
        return true;
    }
    checkForDirectDeposit(hasDirectDeposit) {
        if (!hasDirectDeposit) {
            this.dueDate.setTime(this.dueDate.getTime() + this.oneDayInMilliSec);
        }
    }
    checkForHolidaysAndWeekend(holidays) {
        let isHoliday = false;
        let isWeekend = false;
        do {
            isHoliday = this.isHoliday(holidays);
            isWeekend = this.isWeekend();
        } while (isHoliday || isWeekend);
    }
    isHoliday(holidays) {
        for (let i in holidays) {
            if ((this.dueDate.getMonth() === holidays[i].getMonth()) && (this.dueDate.getDate() === holidays[i].getDate())) {
                this.loopType = 'reverse';
                this.adjustDueDateLoopType();
                return true;
            }
        }
        return false;
    }
    isWeekend() {
        if (this.dueDate.getDay() === 0 || this.dueDate.getDay() === 6) {
            this.adjustDueDateLoopType();
            return true;
        }
        return false;
    }
    adjustDueDateLoopType() {
        if (this.loopType === 'forward') {
            this.dueDate.setTime(this.dueDate.getTime() + this.oneDayInMilliSec);
        }
        if (this.loopType === 'reverse') {
            this.dueDate.setTime(this.dueDate.getTime() - this.oneDayInMilliSec);
        }
    }
}
/*
const client = new PayDateCalculator();
const fundDate = new Date('June 17, 2022');
const holidays = [new Date('June 25, 2022'), new Date('July 4, 2022'),];
const paySpan = 'weekly'
const payDate = new Date('June 11, 2022');
const hasDirDep = true

const duedateCalculated = client.calculateDueDate(fundDate, holidays, paySpan, payDate, hasDirDep);
console.log(duedateCalculated);
*/ 
