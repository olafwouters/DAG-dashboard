"""Regression checks for generated manual and automatic Planner save paths."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
FILTERS="for(const id of ['search','ownerFilter'])$(id).addEventListener('input',render);for(const id of ['clusterFilter','levelFilter','formFilter','typeFilter'])$(id).onchange=render;"
ASSIGNMENT='state.cells[edit.id][edit.b]=c;save();render();'
EQUALITY="if(canonical({...c,updated:''})===canonical({...cell({id:edit.id},edit.b),updated:''})){"
RESTORE='state.cells[edit.id][edit.b]=c;delete state.hiddenProgrammeTrajectories?.[edit.id];save();render();'

class VisibilityBuildTests(unittest.TestCase):
    def test_both_validated_save_paths_restore_only_current_programme(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/'_site').mkdir()
            (root/'web').mkdir()
            (root/'_site/index.html').write_text(FILTERS+'\nif(invalid)return;'+ASSIGNMENT+'\n<script src="./shared-planner.js"></script>',encoding='utf-8')
            (root/'_site/status-board.js').write_text('function renderStatusBoard(ps){}\nfunction setBoardStatus(){}',encoding='utf-8')
            (root/'_site/shared-planner.js').write_text('if(invalid)return;'+EQUALITY+'return;}'+ASSIGNMENT,encoding='utf-8')
            for name in ['status-containers.js','activity-board.js']:
                (root/'web'/name).write_text('',encoding='utf-8')
            subprocess.run([sys.executable,str(ROOT/'scripts/connect_activity_board.py')],cwd=root,check=True)
            html=(root/'_site/index.html').read_text(encoding='utf-8')
            shared=(root/'_site/shared-planner.js').read_text(encoding='utf-8')
            for output in [html,shared]:
                self.assertEqual(output.count(RESTORE),1)
                self.assertLess(output.index('if(invalid)return;'),output.index(RESTORE))
                self.assertNotIn('state.hiddenProgrammeTrajectories={}',output)
            self.assertIn("if(!state.hiddenProgrammeTrajectories?.[edit.id]&&canonical",shared)
            self.assertIn('()=>render()',html)

if __name__=='__main__':
    unittest.main()
