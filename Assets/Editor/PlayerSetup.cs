using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class PlayerSetup
{
    private const string SpriteSheetPath = "Assets/player.png";
    private const string ScenePath = "Assets/Scenes/SampleScene.unity";
    private static readonly Rect[] FrameRects =
    {
        new Rect(0f, 0f, 377f, 724f),
        new Rect(377f, 0f, 296f, 724f),
        new Rect(675f, 0f, 372f, 724f),
        new Rect(1065f, 0f, 350f, 724f),
        new Rect(1419f, 0f, 361f, 724f),
        new Rect(1790f, 0f, 382f, 724f)
    };

    [MenuItem("ARCHI/Setup Player")]
    private static void Setup()
    {
        if (EditorApplication.isPlayingOrWillChangePlaymode)
        {
            return;
        }

        ConfigureSpriteSheet();

        if (SceneManager.GetActiveScene().path != ScenePath)
        {
            return;
        }

        Sprite[] frames = AssetDatabase.LoadAllAssetsAtPath(SpriteSheetPath)
            .OfType<Sprite>()
            .OrderBy(sprite => sprite.name)
            .ToArray();

        if (frames.Length != FrameRects.Length)
        {
            Debug.LogError($"Player setup expected {FrameRects.Length} sprites but found {frames.Length}.");
            return;
        }

        GameObject player = GameObject.Find("Player") ?? new GameObject("Player");
        SpriteRenderer renderer = GetOrAdd<SpriteRenderer>(player);
        Rigidbody2D body = GetOrAdd<Rigidbody2D>(player);
        CapsuleCollider2D collider = GetOrAdd<CapsuleCollider2D>(player);
        PlayerMovement movement = GetOrAdd<PlayerMovement>(player);

        renderer.sprite = frames[0];
        body.gravityScale = 0f;
        body.freezeRotation = true;
        body.interpolation = RigidbodyInterpolation2D.Interpolate;
        collider.direction = CapsuleDirection2D.Vertical;
        collider.size = new Vector2(2f, 6f);
        collider.offset = new Vector2(0f, 3f);

        if (player.transform.position == Vector3.zero)
        {
            player.transform.SetPositionAndRotation(new Vector3(0f, -4.5f, 0f), Quaternion.identity);
            player.transform.localScale = Vector3.one * 0.65f;
        }

        SerializedObject serializedMovement = new SerializedObject(movement);
        SerializedProperty frameProperty = serializedMovement.FindProperty("walkFrames");
        frameProperty.arraySize = frames.Length;
        for (int i = 0; i < frames.Length; i++)
        {
            frameProperty.GetArrayElementAtIndex(i).objectReferenceValue = frames[i];
        }
        serializedMovement.ApplyModifiedPropertiesWithoutUndo();

        EditorUtility.SetDirty(player);
        EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());
        EditorSceneManager.SaveScene(SceneManager.GetActiveScene());
    }

    private static void ConfigureSpriteSheet()
    {
        TextureImporter importer = AssetImporter.GetAtPath(SpriteSheetPath) as TextureImporter;
        if (importer == null)
        {
            Debug.LogError($"Player sprite sheet was not found at {SpriteSheetPath}.");
            return;
        }

        importer.textureType = TextureImporterType.Sprite;
        importer.spriteImportMode = SpriteImportMode.Multiple;
        importer.spritePixelsPerUnit = 100f;
        importer.mipmapEnabled = false;
        importer.maxTextureSize = 4096;

        SpriteMetaData[] sprites = new SpriteMetaData[FrameRects.Length];
        for (int i = 0; i < FrameRects.Length; i++)
        {
            sprites[i] = new SpriteMetaData
            {
                name = $"player_{i}",
                rect = FrameRects[i],
                alignment = (int)SpriteAlignment.Custom,
                pivot = new Vector2(0.5f, 0f)
            };
        }

#pragma warning disable CS0618
        importer.spritesheet = sprites;
#pragma warning restore CS0618
        importer.SaveAndReimport();
    }

    private static T GetOrAdd<T>(GameObject target) where T : Component
    {
        return target.TryGetComponent(out T component) ? component : target.AddComponent<T>();
    }
}
