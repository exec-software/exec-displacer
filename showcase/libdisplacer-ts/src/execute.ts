import { applyTheme, execute, displacerDark } from '../../../lib/libdisplacer-ts/src/theme/index'
import '../../../lib/libdisplacer-ts/src/components/index'

applyTheme(execute)
const selection = document.querySelector<HTMLSelectElement>('#theme')!
selection.addEventListener('change', () => applyTheme(selection.value === 'execute' ? execute : displacerDark))
