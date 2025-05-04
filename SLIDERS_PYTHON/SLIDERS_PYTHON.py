import adsk.core, adsk.fusion, adsk.cam, traceback
import json
import os
import time

def run(context):
    ui = None
    palette = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = app.activeProduct

        # Write all user parameters to config.json at startup
        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        user_params = design.userParameters
        config_data = []
        for i in range(user_params.count):
            param = user_params.item(i)
            config_data.append({
                'name': param.name,
                'value': param.value,
                'expression': param.expression,
                'units': param.unit
            })
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)

        json_path = os.path.join(os.path.dirname(__file__), 'parameters.json')
        if not os.path.exists(json_path):
            ui.messageBox('parameters.json file not found!')
            return

        # Use a real HTML file for the palette
        palette_id = 'ParamSyncPalette'
        palette_html_path = os.path.join(os.path.dirname(__file__), 'palette.html')
        palette_url = 'file://' + palette_html_path
        palette = ui.palettes.itemById(palette_id)
        if palette:
            palette.deleteMe()
        palette = ui.palettes.add(
            palette_id,
            'Parameter Sync',
            palette_url,
            True, True, True, 300, 120
        )

        stop = False

        class HTMLHandler(adsk.core.HTMLEventHandler):
            def notify(self, args):
                nonlocal stop
                if args.data == 'stop':
                    stop = True

        handler = HTMLHandler()
        palette.incomingFromHTML.add(handler)

        while palette.isVisible and not stop:
            try:
                with open(json_path, 'r') as f:
                    content = f.read()
                    if not content.strip():
                        continue
                    data = json.loads(content)
                user_params = design.userParameters
                for param in data.get('parameters', []):
                    param_name = param.get('name')
                    value = param.get('value')
                    if param_name is None or value is None:
                        continue
                    user_param = user_params.itemByName(param_name)
                    if user_param:
                        user_param.expression = str(value)
                    else:
                        user_params.add(param_name, adsk.core.ValueInput.createByReal(value), '', '')
            except Exception as e:
                if 'Expecting value' not in str(e):
                    ui.messageBox('Error updating parameters:\n{}'.format(str(e)))
            adsk.doEvents()
            time.sleep(0.1)

        if palette:
            palette.deleteMe()

    except:
        if ui:
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc())) 