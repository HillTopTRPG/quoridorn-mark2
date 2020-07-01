import re
import Tkinter as Tk

def doProcess(fieldName, typeName, defaultValue):
    volatileFieldName = "{0}Volatile".format(fieldName)
    fieldNameUp = fieldName[0].upper() + fieldName[1:]
    volatileFieldNameUp = volatileFieldName[0].upper() + volatileFieldName[1:]
    print('')
    print('    // ' + fieldName)
    print('@Prop({ type: ' + typeName[0].upper() + typeName[1:] + ', required: true })')
    print('private ' + fieldName + '!: ' + typeName + ';')
    print('private ' + volatileFieldName + ': ' + typeName + ' = ' + defaultValue + ';')
    print('@Watch("' + fieldName + '", { immediate: true })')
    print('private onChange' + fieldNameUp + '(value: ' + typeName + ') {')
    print('  this.' + volatileFieldName + ' = value;')
    print('}')
    print('@Watch("' + volatileFieldName + '")')
    print('private onChange' + volatileFieldNameUp + '(value: ' + typeName + ') {')
    print('  this.$emit("update:' + fieldName + '", value);')
    print('}')

def viewDialog():
    root = Tk.Tk()
    rowNum = 0

    # label
    label = Tk.Label(text="Field: ")
    label.grid(row=rowNum, column=0)

    # input
    fieldNameElm = Tk.Entry(root, width=20)
    fieldNameElm.grid(row=rowNum, column=1)

    rowNum += 1

    # label
    label = Tk.Label(text="type: ")
    label.grid(row=rowNum, column=0)

    # input
    typeNameElm = Tk.Entry(width=20)
    typeNameElm.insert(Tk.END, "string")
    typeNameElm.grid(row=rowNum, column=1)

    rowNum += 1

    # label
    label = Tk.Label(text="default: ")
    label.grid(row=rowNum, column=0)

    # input
    defaultValueElm = Tk.Entry(width=20)
    defaultValueElm.insert(Tk.END, '""')
    defaultValueElm.grid(row=rowNum, column=1)

    rowNum += 1

    # button
    buttonElm = Tk.Button(root, text='exec', command=lambda: doProcess(fieldNameElm.get(), typeNameElm.get(), defaultValueElm.get()))
    buttonElm.grid(row=rowNum, column=0)

    root.mainloop()


if __name__ == '__main__':
    viewDialog()
