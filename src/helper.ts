const helper = {
  casing: 'camel' as 'camel' | 'snake',
  setCasing(casing: 'camel' | 'snake') {
    this.casing = casing;
  },
  getBelongsToPostFix() {
    if (this.casing === 'camel') return 'Id';
    if (this.casing === 'snake') return '_id';
  },
  getHasManyPostFix() {
    if (this.casing === 'camel') return 'Ids';
    if (this.casing === 'snake') return '_ids';
  },
  removeHasManyPostfix(fieldName: string) {
    var re = new RegExp(this.getHasManyPostFix() + '$', 'g');
    return fieldName.replace(re, '');
  },
  addBelongsToPostFix(fieldName: string) {
    return fieldName + this.getBelongsToPostFix();
  },
  addHasManyPostFix(fieldName: string) {
    return fieldName + this.getHasManyPostFix();
  },
};

export default helper;
