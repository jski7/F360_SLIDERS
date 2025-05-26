import adsk.core, adsk.fusion, adsk.cam, traceback
import json
import os
import time
import math

def run(context):
    ui = None
    palette = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        design = app.activeProduct

        config_path = os.path.join(os.path.dirname(__file__), 'config.json')
        user_params = design.userParameters
        LENGTH_UNITS = {'mm', 'cm', 'm', 'in', 'ft'}
        # Write all user parameters to config.json at startup and then every second
        def export_config_json(user_params):
            config_data = []
            for i in range(user_params.count):
                param = user_params.item(i)
                unit = param.unit
                if unit in LENGTH_UNITS:
                    scaled_value = param.value * 10
                elif unit == 'deg':
                    scaled_value = param.value * 180.0 / math.pi
                else:
                    scaled_value = param.value
                param_data = {
                    'name': param.name,
                    'value': scaled_value,
                    'expression': param.expression,
                    'units': param.unit
                }
                config_data.append(param_data)
            with open(config_path, 'w') as f:
                json.dump(config_data, f, indent=2)
            print(f"Exported {len(config_data)} parameters to config.json")

        # Initial export
        export_config_json(user_params)

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
            True, True, True, 300, 300
        )

        stop = False

        class HTMLHandler(adsk.core.HTMLEventHandler):
            def notify(self, args):
                nonlocal stop
                if args.data == 'stop':
                    stop = True

        handler = HTMLHandler()
        palette.incomingFromHTML.add(handler)

        # Cache to store last known parameter values (optimization)
        param_cache = {}
        
        # File content cache to avoid re-reading unchanged file
        last_modified_time = 0
        last_param_data = None
        
        while palette.isVisible and not stop:
            try:
                # Export config.json every second
                if int(time.time() * 10) % 10 == 0:  # every second
                    export_config_json(user_params)
                
                # OPTIMIZATION 1: Only read file if it's been modified
                current_modified_time = os.path.getmtime(json_path)
                if current_modified_time != last_modified_time:
                    with open(json_path, 'r') as f:
                        content = f.read()
                        if not content.strip():
                            adsk.doEvents()
                            continue
                        last_param_data = json.loads(content)
                        last_modified_time = current_modified_time
                
                # Skip if no data available yet
                if not last_param_data:
                    adsk.doEvents()
                    time.sleep(0.01)
                    continue
                    
                # OPTIMIZATION 2: Process parameters in batches for efficiency
                changes_made = False
                
                # After loading the new parameters from JSON:
                web_param_names = set(
                    param['name'] for param in last_param_data.get('parameters', []) if param['name'].strip() != ''
                )

                # Get all user parameter names in Fusion 360
                fusion_param_names = set([user_params.item(i).name for i in range(user_params.count)])

                # Find parameters to delete
                params_to_delete = fusion_param_names - web_param_names

                for param_name in params_to_delete:
                    try:
                        user_params.itemByName(param_name).deleteMe()
                        print(f"Deleted parameter: {param_name}")
                    except:
                        print(f"Could not delete parameter: {param_name}")
                
                for param in last_param_data.get('parameters', []):
                    param_name = param.get('name')
                    value = param.get('value')
                    unit = param.get('unit', 'mm')
                    if param_name is None or value is None:
                        continue
                    # OPTIMIZATION 3: Skip if value hasn't changed AND unit hasn't changed
                    cache_key = f"{param_name}"
                    user_param = user_params.itemByName(param_name)
                    if cache_key in param_cache and param_cache[cache_key] == value:
                        # But if the unit has changed, we still need to update!
                        if user_param and user_param.unit == unit:
                            continue
                    # Check if this is a new parameter (not existing in Fusion)
                    if not user_param:
                        # For new parameters, scale the value by 0.1 only for length units
                        if unit in LENGTH_UNITS:
                            scaled_value = value * 0.1
                        else:
                            scaled_value = value
                        print(f"Creating new parameter: {param_name}, Original Value: {value}, Scaled Value: {scaled_value}, Unit: {unit}")
                        unit_to_use = '' if unit == 'no unit' else unit
                        user_params.add(param_name, adsk.core.ValueInput.createByReal(scaled_value), unit_to_use, '')
                    else:
                        # For existing parameters (slider updates), use value directly
                        scaled_value = value
                        print(f"Updating parameter: {param_name}, Value: {value}, Unit: {unit}")
                        if unit != 'no unit' and user_param.unit != unit:
                            # Delete and re-add parameter with new unit
                            param_name = user_param.name
                            user_param.deleteMe()
                            if unit in LENGTH_UNITS:
                                scaled_value = value * 0.1
                            else:
                                scaled_value = value
                            unit_to_use = '' if unit == 'no unit' else unit
                            user_params.add(param_name, adsk.core.ValueInput.createByReal(scaled_value), unit_to_use, '')
                            print(f"Deleted and re-added parameter: {param_name} with unit {unit_to_use}")
                        elif unit == 'no unit' and user_param.unit != '':
                            param_name = user_param.name
                            user_param.deleteMe()
                            scaled_value = value
                            user_params.add(param_name, adsk.core.ValueInput.createByReal(scaled_value), '', '')
                            print(f"Deleted and re-added parameter: {param_name} with no unit")
                        else:
                            user_param.expression = str(scaled_value)
                    
                    # Log confirmation
                    updated_param = user_params.itemByName(param_name)
                    if updated_param:
                        print(f"Parameter {param_name} updated to: {updated_param.value} {updated_param.unit}")
                    
                    # Update cache
                    param_cache[cache_key] = value
                    changes_made = True
                
                # OPTIMIZATION 4: Only force UI update if changes were made
                if changes_made:
                    app.activeViewport.refresh()
                    
            except Exception as e:
                # Reduce error logging noise - only show non-file related errors
                if 'Expecting value' not in str(e) and 'No JSON object could be decoded' not in str(e):
                    ui.messageBox('Error updating parameters:\n{}'.format(str(e)))
            
            # Process UI events and wait before next iteration
            adsk.doEvents()
            time.sleep(0.01)  # Update 100 times per second for real-time feel

        if palette:
            palette.deleteMe()

    except:
        if ui:
            ui.messageBox('Failed:\n{}'.format(traceback.format_exc()))

def update_fusion_parameters(params):
    app = adsk.core.Application.get()
    design = adsk.fusion.Design.cast(app.activeProduct)
    if not design:
        return
    for p in params:
        user_params = design.userParameters  # Always re-fetch
        name = p.get('name')
        value = p.get('value')
        unit = p.get('unit', '')
        if not name:
            continue
        user_param = user_params.itemByName(name)
        if user_param:
            try:
                user_param.expression = str(value)
                # Only update unit if it's different
                if unit and user_param.unit != unit:
                    user_param.unit = unit
            except Exception as e:
                print(f"Failed to update parameter {name}: {e}")
        else:
            try:
                user_params.add(name, adsk.core.ValueInput.createByReal(float(value)), unit, '')
            except Exception as e:
                print(f"Failed to add parameter {name}: {e}") 