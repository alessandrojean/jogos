desktop_file = i18n.merge_file(
        input: 'io.github.alessandrojean.jogos.desktop.in',
       output: 'io.github.alessandrojean.jogos.desktop',
         type: 'desktop',
       po_dir: '../po',
      install: true,
  install_dir: join_paths(get_option('datadir'), 'applications')
)

desktop_utils = find_program('desktop-file-validate', required: false)
if desktop_utils.found()
  test('Validate desktop file', desktop_utils, args: [desktop_file])
endif

appstream_file = i18n.merge_file(
        input: 'io.github.alessandrojean.jogos.metainfo.xml.in',
       output: 'io.github.alessandrojean.jogos.metainfo.xml',
       po_dir: '../po',
      install: true,
  install_dir: join_paths(get_option('datadir'), 'metainfo')
)

appstream_util = find_program('appstream-util', required: false)
if appstream_util.found()
  test('Validate appstream file', appstream_util, args: ['validate', '--nonet', appstream_file])
endif

gsettings_schema = 'io.github.alessandrojean.jogos.gschema.xml'

local_schemas = configure_file(
  copy: true,
  input: gsettings_schema,
  output: gsettings_schema
)

install_data(gsettings_schema,
  install_dir: join_paths(get_option('datadir'), 'glib-2.0/schemas')
)

compile_schemas = find_program('glib-compile-schemas', required: false)

compile_local_schemas = custom_target(
  'compile_local_schemas',
  input: local_schemas,
  output: 'gschemas.compiled',
  command: [compile_schemas, meson.current_build_dir()]
)

if compile_schemas.found()
  test('Validate schema file',
       compile_schemas,
       args: ['--strict', '--dry-run', meson.current_source_dir()])
endif

blueprints = custom_target('blueprints',
  input: files(
    'ui/create-game-dialog.blp',
    'ui/edit-game-dialog.blp',
    'ui/game-details-dialog.blp',
    'ui/game-grid-item.blp',
    'ui/game-title-column.blp',
    'ui/games-view.blp',
    'ui/help-overlay.blp',
    'ui/online-game-result.blp',
    'ui/preferences-dialog.blp',
    'ui/sidebar-item.blp',
    'ui/window.blp',
  ),
  output: '.',
  command: [find_program('blueprint-compiler'), 'batch-compile', '@OUTPUT@', '@CURRENT_SOURCE_DIR@', '@INPUT@']
)

data_res = gnome.compile_resources(
  'io.github.alessandrojean.jogos.data',
  'io.github.alessandrojean.jogos.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
  dependencies: blueprints,
)

subdir('icons')
