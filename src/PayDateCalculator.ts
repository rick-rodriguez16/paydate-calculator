/* This method determines the first available due date follwing the funding of a loan. */

class PayDateCalculator {

    protected dueDate: Date;                                    // The due date will be adjusted and must meet all requirements 
    
    private payDateAfterFundDate: Date = new Date();            // The clients unadjusted paydate (post fund date) based on their pay date 
                                                                //   model(payDay and paySpan) and will set the initial due date. It will be
                                                                //   use to assign the due date to an advanced pay date to meet all requirements.
    private loopType: string = 'forward';   
    private oneDayInMilliSec: number = 24 * 60 * 60 * 1000;

    constructor() {
        this.dueDate = new Date();
    }
    
    public calculateDueDate(fundDay: Date, holidays: Date[], paySpan: string, payDay: Date, hasDirectDeposit: boolean): Date { 
        
        this.setInitialDueDate(fundDay, paySpan, payDay);
        this.processDueDate(fundDay, holidays, paySpan, hasDirectDeposit);
        return this.dueDate;
    }


    //helper functions

    // Set the initial due date to the first pay date after the fund day and before other
    // factors are processed (direct deposit, holidays, weekends, 10 days after fund date, etc.)

    private setInitialDueDate(fundDay: Date, paySpan: string, payDay: Date): void {
        this.dueDate.setTime(this.firstPayDateAfterFundDate(fundDay, paySpan, payDay));
    }

    private firstPayDateAfterFundDate(fundDay: Date, paySpan: string, payDay: Date): number {
        
        this.payDateAfterFundDate.setTime(payDay.getTime());

        // if the pay date provided is before the fundDay, continue to add the paySpan until
        // the first pay date after the fundDay is reached.
        while (this.payDateAfterFundDate.getTime() < fundDay.getTime()) {
            this.payDateAfterFundDate.setTime(this.payDateAfterFundDate.getTime() + this.payDateModel(paySpan));
        }
        
        return this.payDateAfterFundDate.getTime();
    }

    private payDateModel(paySpan: string):number {
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

    private processDueDate(fundDay: Date, holidays: Date[], paySpan: string, hasDirectDeposit: boolean): void {

        do {
            this.checkForDirectDeposit(hasDirectDeposit);
            this.checkForHolidaysAndWeekend(holidays);
        } while(!this.isDueDateTenDaysAfterFundDate(fundDay, paySpan));
    }

    private isDueDateTenDaysAfterFundDate(fundDay: Date, paySpan: string): boolean {
        
        let fundDatePlusTenDays: Date = new Date(fundDay.getTime() + 10 * this.oneDayInMilliSec);

        if (this.dueDate.getTime() < fundDatePlusTenDays.getTime()) {

            // set due date to the next forward pay date
            this.payDateAfterFundDate.setTime(this.payDateAfterFundDate.getTime() + this.payDateModel(paySpan));          
            this.dueDate.setTime(this.payDateAfterFundDate.getTime());
            this.loopType = 'forward';
            return false;
        }
        return true;
    }

    private checkForDirectDeposit(hasDirectDeposit: boolean): void {
        
        if(!hasDirectDeposit) {
            this.dueDate.setTime(this.dueDate.getTime() + this.oneDayInMilliSec);
        }
    }

    private checkForHolidaysAndWeekend(holidays: Date[]):void {
        
        let isHoliday: boolean = false;
        let isWeekend: boolean = false;
        do {
            isHoliday = this.isHoliday(holidays);
            isWeekend = this.isWeekend();
        } while(isHoliday || isWeekend);
    }

    private isHoliday(holidays: Date[]):boolean {

        for (let i in holidays) {
            if ((this.dueDate.getMonth() === holidays[i].getMonth()) && (this.dueDate.getDate() === holidays[i].getDate())) {                
                this.loopType = 'reverse';
                this.adjustDueDateLoopType();
                return true;
            }
        }
        return false;
    }

    private isWeekend(): boolean {

        if(this.dueDate.getDay() === 0 || this.dueDate.getDay() === 6) {            
            this.adjustDueDateLoopType();
            return true;
        }
        return false;
    }

    private adjustDueDateLoopType():void {

        if (this.loopType === 'forward') {
            this.dueDate.setTime(this.dueDate.getTime() + this.oneDayInMilliSec);
        }

        if (this.loopType === 'reverse') {
            this.dueDate.setTime(this.dueDate.getTime() - this.oneDayInMilliSec);
        }
    }
}
