interface ValidityInterval{
    validFrom:string;
    validUntil:string|null;
}

export function intervalsOverlap(a: ValidityInterval, b: ValidityInterval):boolean{
    const aEndsAfterBStarts=a.validUntil===null || b.validFrom<a.validUntil;
    const bEndsAfterAStarts =b.validUntil===null || a.validFrom<b.validUntil;
    return aEndsAfterBStarts && bEndsAfterAStarts;
}